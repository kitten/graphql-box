import { LevelInterface } from '../level';
import { FieldDefinition, Serializer, Deserializer } from '../internal';

import { sortFields, nextObjectOrNull, closeIter } from './helpers';
import { genId, gen2DKey, gen3DKey, rangeOfKey } from './keys';
import { mutexBatchFactory, MutexBatch } from './mutexBatch';
import ObjectFieldIndex from './ObjectFieldIndex';
import ObjectFieldOrdinal from './ObjectFieldOrdinal';
import AsyncObjectIterator from './AsyncObjectIterator';

import {
  ObjectLike,
  ObjectTableParams,
  IteratorOptions,
  FieldIndexMap,
  FieldOrdinalMap,
} from './types';

class ObjectTable<T extends ObjectLike, K extends keyof T = keyof T> {
  name: string;
  store: LevelInterface;
  mutexBatch: MutexBatch;

  fields: FieldDefinition<T[K], K>[];
  fieldsLength: number;
  fieldNames: K[];

  encoders: Serializer<T[K]>[];
  decoders: Deserializer<T[K]>[];

  index: FieldIndexMap<T>;
  ordinal: FieldOrdinalMap<T>;

  constructor(params: ObjectTableParams<T, K>) {
    this.name = params.name;
    this.store = params.store;
    this.mutexBatch = mutexBatchFactory(this.store);

    this.fields = sortFields(params.fields);
    const fieldsLength = (this.fieldsLength = this.fields.length);
    this.fieldNames = new Array(fieldsLength);

    this.encoders = new Array(fieldsLength);
    this.decoders = new Array(fieldsLength);

    this.index = {} as FieldIndexMap<T>;
    this.ordinal = {} as FieldOrdinalMap<T>;

    for (let i = 0; i < fieldsLength; i++) {
      const field = this.fields[i];
      const fieldName = (this.fieldNames[i] = field.name);

      this.encoders[i] = field.encode;
      this.decoders[i] = field.decode;

      const indexParams = {
        typeName: this.name,
        fieldName: fieldName,
        store: this.store,
      };

      if (field.isUnique) {
        this.index[fieldName] = new ObjectFieldIndex<K>(indexParams);
      } else if (field.isOrdinal) {
        this.ordinal[fieldName] = new ObjectFieldOrdinal<K>(indexParams);
      }
    }
  }

  iterator({ reverse = false, limit = -1 }: IteratorOptions = {}): AsyncObjectIterator<T, K> {
    const { store, name, fieldsLength, fieldNames, decoders } = this;
    const range = rangeOfKey(name);
    range.reverse = reverse;
    range.limit = limit > 0 ? limit * fieldsLength : limit;
    const iterator = store.iterator(range);
    return new AsyncObjectIterator<T, K>(fieldNames, decoders, iterator);
  }

  async getObject(id: string) {
    const { store, name, fieldNames, decoders } = this;
    const range = rangeOfKey(gen2DKey(name, id));
    const iterator = store.iterator(range);
    const res = await nextObjectOrNull<T, K>(fieldNames, decoders, iterator);
    await closeIter(iterator);
    return res;
  }

  async getIdByIndex(where: Partial<T>): Promise<string | null> {
    const { store, name, fieldsLength, index, fieldNames, encoders } = this;

    let firstId = null;
    if (where.id !== null) {
      const key = gen3DKey(name, where.id, 'id');
      firstId = await store.get(key);
    }

    for (let i = 0, l = fieldsLength; i < l; i++) {
      const fieldName = fieldNames[i];
      const fieldIndex = index[fieldName];
      if (fieldIndex !== undefined && fieldName in where) {
        const value = encoders[i](where[fieldName]);
        const id = await fieldIndex.lookup(value);

        if (id === null || (firstId !== null && firstId !== id)) {
          return null;
        } else {
          firstId = id;
        }
      }
    }

    return firstId;
  }

  async findObjectByIndex(where: Partial<T>): Promise<T | null> {
    const id = await this.getIdByIndex(where);
    if (id === null) {
      return null;
    }

    return await this.getObject(id);
  }

  async createObject(data: Partial<T>): Promise<T> {
    const { name, index, ordinal, fields, fieldsLength, encoders } = this;
    const id = (data.id = genId());
    data.createdAt = data.updatedAt = new Date();

    await this.mutexBatch(async b => {
      let batch = b;

      for (let i = 0, l = fieldsLength; i < l; i++) {
        const { name: fieldName, defaultValue } = fields[i];
        const fieldIndex = index[fieldName];
        const fieldOrdinal = ordinal[fieldName];
        const encode = encoders[i];

        const fallbackValue = defaultValue === undefined ? null : defaultValue;
        const shouldDefault = !(fieldName in data);
        const value = encode(shouldDefault ? fallbackValue : data[fieldName]);

        batch = batch.put(gen3DKey(name, id, fieldName), value);
        if (fieldIndex !== undefined) {
          batch = await fieldIndex.index(value, id, batch);
        } else if (fieldOrdinal !== undefined) {
          batch = fieldOrdinal.index(value, id, batch);
        }
      }

      return batch;
    });

    return data as T;
  }

  async updateObject(where: Partial<T>, data: Partial<T>): Promise<T> {
    const id = await this.getIdByIndex(where);
    if (id === null) {
      throw new Error('No object has been found to update');
    }

    const { name, index, ordinal, fields, fieldsLength, encoders } = this;
    const prev = await this.getObject(id);
    data.updatedAt = new Date();

    await this.mutexBatch(async b => {
      let batch = b;

      for (let i = 0, l = fieldsLength; i < l; i++) {
        const { name: fieldName, isReadOnly, defaultValue } = fields[i];
        if (isReadOnly || !(fieldName in data)) {
          data[fieldName] = prev[fieldName];
        } else {
          const fieldIndex = index[fieldName];
          const fieldOrdinal = ordinal[fieldName];
          const encode = encoders[i];

          const prevVal = encode(prev[fieldName]);
          const input = data[fieldName];
          const shouldDefault = !!defaultValue && input === null;
          const value = encode(shouldDefault ? defaultValue : input);

          batch = batch.put(gen3DKey(name, id, fieldName), value);
          if (fieldIndex !== undefined) {
            batch = await fieldIndex.reindex(prevVal, value, id, batch);
          } else if (fieldOrdinal !== undefined) {
            batch = fieldOrdinal.reindex(prevVal, value, id, batch);
          }
        }
      }

      return batch;
    });

    return data as T;
  }

  async deleteObject(where: Partial<T>): Promise<T> {
    const id = await this.getIdByIndex(where);
    if (id === null) {
      throw new Error('No object has been found to delete');
    }

    const { name, index, ordinal, fields, fieldsLength, encoders } = this;
    const data = await this.getObject(id);

    await this.mutexBatch(async b => {
      let batch = b;

      for (let i = 0, l = fieldsLength; i < l; i++) {
        const { name: fieldName } = fields[i];
        const fieldIndex = index[fieldName];
        const fieldOrdinal = ordinal[fieldName];
        const encode = encoders[i];

        batch = batch.del(gen3DKey(name, id, fieldName));

        if (fieldIndex !== undefined) {
          batch = fieldIndex.unindex(encode(data[fieldName]), id, batch);
        } else if (fieldOrdinal !== undefined) {
          batch = fieldOrdinal.unindex(encode(data[fieldName]), id, batch);
        }
      }

      return batch;
    });

    return data;
  }
}

export default ObjectTable;
