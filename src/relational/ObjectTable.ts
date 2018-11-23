import { LevelInterface } from '../level';
import { makeEncoder } from '../encode';
import { sanitiseFields } from '../internal/fields';
import { nextObjectOrNull, closeIter } from './helpers';
import { genId, gen2DKey, gen3DKey, rangeOfKey } from './keys';
import { mutexBatchFactory, MutexBatch } from './mutexBatch';
import ObjectFieldIndex from './ObjectFieldIndex';
import AsyncObjectIterator from './AsyncObjectIterator';

import {
  ObjectLike,
  ObjectTableParams,
  ObjectFieldDefinition,
  IteratorOptions,
  FieldIndexMap,
  EncoderMap,
  EncoderList,
} from './types';

class ObjectTable<T extends ObjectLike, K extends keyof T = keyof T> {
  name: string;
  store: LevelInterface;
  fields: ObjectFieldDefinition<K>[];
  fieldsLength: number;
  fieldNames: K[];
  encoderMap: EncoderMap<T>;
  encoderList: EncoderList<T>;
  index: FieldIndexMap<T>;
  mutexBatch: MutexBatch;

  constructor(params: ObjectTableParams<K>) {
    this.name = params.name;
    this.store = params.store;
    this.mutexBatch = mutexBatchFactory(this.store);
    this.index = {} as FieldIndexMap<T>;
    this.fields = sanitiseFields<T, K>(params.fields);
    this.fieldsLength = this.fields.length;
    this.fieldNames = new Array(this.fieldsLength);
    this.encoderMap = {} as EncoderMap<T>;
    this.encoderList = new Array(this.fieldsLength);

    for (let i = 0; i < this.fieldsLength; i++) {
      const field = this.fields[i];
      const fieldName = field.name;
      if (field.isUnique) {
        this.index[fieldName] = new ObjectFieldIndex<K>({
          typeName: this.name,
          fieldName: fieldName,
          store: this.store,
        });
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
        const { serializer } = this.encoderMap[name];
        const fallbackValue = defaultValue === undefined ? null : defaultValue;
        const shouldDefault = !(name in data);
        const value = serializer(shouldDefault ? fallbackValue : data[name]);

        batch = batch.put(gen3DKey(this.name, id, name), value);
        if (index !== undefined) {
          batch = await index.index(value, id, batch);
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
          const { serializer } = this.encoderMap[name];
          const prevVal = serializer(prev[name]);
          const input = data[name];
          const shouldDefault = !!defaultValue && input === null;
          const value = serializer(shouldDefault ? defaultValue : input);

          batch = batch.put(gen3DKey(this.name, id, name), value);
          if (index !== undefined) {
            batch = await index.reindex(prevVal, value, id, batch);
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
        batch = batch.del(gen3DKey(this.name, id, name));
        const index = this.index[name];
        if (index !== undefined) {
          const { serializer } = this.encoderMap[name];
          batch = index.unindex(serializer(data[name]), id, batch);
        }
      }

      return batch;
    });

    return data;
  }
}

export default ObjectTable;
