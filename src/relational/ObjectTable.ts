import { LevelInterface } from '../level';
import { FieldDefinition } from '../internal';
import { makeEncoder } from '../encode';
import { nextObjectOrNull, closeIter } from './helpers';
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
  EncoderMap,
  EncoderList,
} from './types';

class ObjectTable<T extends ObjectLike, K extends keyof T = keyof T> {
  name: string;
  store: LevelInterface;
  fields: FieldDefinition<K>[];
  fieldsLength: number;
  fieldNames: K[];
  encoderMap: EncoderMap<T>;
  encoderList: EncoderList<T>;
  index: FieldIndexMap<T>;
  ordinal: FieldOrdinalMap<T>;
  mutexBatch: MutexBatch;

  constructor(params: ObjectTableParams<K>) {
    this.name = params.name;
    this.store = params.store;
    this.mutexBatch = mutexBatchFactory(this.store);
    this.index = {} as FieldIndexMap<T>;
    this.ordinal = {} as FieldOrdinalMap<T>;
    this.fields = params.fields;
    this.fieldsLength = this.fields.length;
    this.fieldNames = new Array(this.fieldsLength);
    this.encoderMap = {} as EncoderMap<T>;
    this.encoderList = new Array(this.fieldsLength);

    for (let i = 0; i < this.fieldsLength; i++) {
      const field = this.fields[i];
      const fieldName = field.name;
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

      const encoder = makeEncoder(field);
      this.encoderMap[fieldName] = this.encoderList[i] = encoder;
      this.fieldNames[i] = fieldName;
    }
  }

  iterator({ reverse = false, limit = -1 }: IteratorOptions = {}): AsyncObjectIterator<T, K> {
    const { store, name, fieldsLength, fieldNames, encoderList } = this;
    const range = rangeOfKey(name);
    range.reverse = reverse;
    range.limit = limit > 0 ? limit * fieldsLength : limit;
    const iterator = store.iterator(range);
    return new AsyncObjectIterator<T, K>(fieldNames, encoderList, iterator);
  }

  async getObject(id: string) {
    const range = rangeOfKey(gen2DKey(this.name, id));
    const iterator = this.store.iterator(range);
    const res = await nextObjectOrNull<T, K>(this.fieldNames, this.encoderList, iterator);
    await closeIter(iterator);
    return res;
  }

  async getIdByIndex(where: Partial<T>): Promise<string | null> {
    let firstId = null;
    if (where.id !== null) {
      const key = gen3DKey(this.name, where.id, 'id');
      firstId = await this.store.get(key);
    }

    for (const fieldName in where) {
      const index = this.index[fieldName];
      if (index !== undefined) {
        const value = this.encoderMap[fieldName].serializer(where[fieldName]);
        const id = await index.lookup(value);

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
    const id = (data.id = genId());
    data.createdAt = data.updatedAt = new Date();

    await this.mutexBatch(async b => {
      let batch = b;
      for (const { name, defaultValue } of this.fields) {
        const index = this.index[name];
        const ordinal = this.ordinal[name];
        const { serializer } = this.encoderMap[name];
        const fallbackValue = defaultValue === undefined ? null : defaultValue;
        const shouldDefault = !(name in data);
        const value = serializer(shouldDefault ? fallbackValue : data[name]);

        batch = batch.put(gen3DKey(this.name, id, name), value);
        if (index !== undefined) {
          batch = await index.index(value, id, batch);
        } else if (ordinal !== undefined) {
          batch = ordinal.index(value, id, batch);
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

    const prev = await this.getObject(id);
    data.updatedAt = new Date();

    await this.mutexBatch(async b => {
      let batch = b;
      for (const { name, defaultValue, isReadOnly } of this.fields) {
        if (isReadOnly || !(name in data)) {
          data[name] = prev[name];
        } else {
          const index = this.index[name];
          const ordinal = this.ordinal[name];
          const { serializer } = this.encoderMap[name];
          const prevVal = serializer(prev[name]);
          const input = data[name];
          const shouldDefault = !!defaultValue && input === null;
          const value = serializer(shouldDefault ? defaultValue : input);

          batch = batch.put(gen3DKey(this.name, id, name), value);
          if (index !== undefined) {
            batch = await index.reindex(prevVal, value, id, batch);
          } else if (ordinal !== undefined) {
            batch = ordinal.reindex(prevVal, value, id, batch);
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

    const data = await this.getObject(id);

    await this.mutexBatch(async b => {
      let batch = b;
      for (const { name } of this.fields) {
        const index = this.index[name];
        const ordinal = this.ordinal[name];
        const { serializer } = this.encoderMap[name];

        batch = batch.del(gen3DKey(this.name, id, name));

        if (index !== undefined) {
          batch = index.unindex(serializer(data[name]), id, batch);
        } else if (ordinal !== undefined) {
          batch = ordinal.unindex(serializer(data[name]), id, batch);
        }
      }

      return batch;
    });

    return data;
  }
}

export default ObjectTable;
