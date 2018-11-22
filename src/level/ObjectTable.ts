import { LevelUp } from 'levelup';
import { ObjectLike, ObjectTableParams, ObjectFieldDefinition, IteratorOptions } from './types';
import { getOrNull, nextObjectOrNull, closeIter, sanitiseFields } from './helpers';
import { genId, gen2DKey, gen3DKey, rangeOfKey } from './keys';
import { mutexBatchFactory, MutexBatch } from './mutexBatch';
import ObjectFieldIndex from './ObjectFieldIndex';
import AsyncObjectIterator from './AsyncObjectIterator';

type FieldIndexMap<T extends ObjectLike> = { [K in keyof T]?: ObjectFieldIndex<T[K], K> };

class ObjectTable<T extends ObjectLike, K extends keyof T = keyof T> {
  name: string;
  fields: ObjectFieldDefinition<K>[];
  fieldNames: K[];
  fieldsLength: number;
  store: LevelUp;
  index: FieldIndexMap<T>;
  mutexBatch: MutexBatch;

  constructor(params: ObjectTableParams<K>) {
    this.name = params.name;
    this.store = params.store;
    this.mutexBatch = mutexBatchFactory(this.store);
    this.index = {} as FieldIndexMap<T>;
    this.fields = sanitiseFields<T, K>(params.fields);
    this.fieldsLength = this.fields.length;
    this.fieldNames = this.fields.map(x => {
      if (x.isUnique) {
        this.index[x.name] = new ObjectFieldIndex<T[K], K>({
          typeName: this.name,
          fieldName: x.name,
          store: this.store,
        });
      }

      return x.name;
    });
  }

  iterator({ reverse = false, limit = -1 }: IteratorOptions = {}): AsyncObjectIterator<T, K> {
    const { store, name, fieldsLength, fieldNames } = this;
    const range = rangeOfKey(name);
    range.reverse = reverse;
    range.limit = limit > 0 ? limit * fieldsLength : limit;
    const iterator = store.iterator(range);
    return new AsyncObjectIterator<T, K>(name, fieldNames, iterator);
  }

  getField(id: string, fieldName: K): Promise<T[K] | null> {
    const key = gen3DKey(this.name, id, fieldName);
    return getOrNull<T[K]>(this.store, key);
  }

  async getObject(id: string) {
    const range = rangeOfKey(gen2DKey(this.name, id));
    const iterator = this.store.iterator(range);
    const res = await nextObjectOrNull<T, K>(this.fieldNames, iterator);
    await closeIter(iterator);
    return res;
  }

  async getIdByIndex(where: Partial<T>): Promise<string | null> {
    let firstId = null;
    if (where.id !== null) {
      firstId = await this.getField(where.id, 'id' as K);
    }

    for (const fieldName in where) {
      const index = this.index[fieldName];
      if (index !== undefined) {
        const value = where[fieldName];
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
    data.createdAt = data.updatedAt = new Date().valueOf();

    await this.mutexBatch(async b => {
      let batch = b;
      for (const { name, defaultValue } of this.fields) {
        const index = this.index[name];
        const input = data[name];
        const shouldDefault = !!defaultValue && input === null;
        const value = (shouldDefault ? defaultValue : input) as T[K];

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
    data.updatedAt = new Date().valueOf();

    await this.mutexBatch(async b => {
      let batch = b;
      for (const { name, defaultValue, isReadOnly } of this.fields) {
        if (isReadOnly || !(name in data)) {
          data[name] = prev[name];
        } else {
          const index = this.index[name];
          const input = data[name];
          const shouldDefault = !!defaultValue && input === null;
          const value = (shouldDefault ? defaultValue : input) as T[K];

          batch = batch.put(gen3DKey(this.name, id, name), value);
          if (index !== undefined) {
            const prevVal = prev[name];
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
          batch = index.unindex(data[name], id, batch);
        }
      }

      return batch;
    });

    return data;
  }
}

export default ObjectTable;
