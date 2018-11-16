import { LevelUp, LevelUpChain } from 'levelup';
import { ObjectLike, ObjectTableParams, ObjectFieldDefinition, IteratorOptions } from './types';
import { getOrNull, nextObjectOrNull, closeIter, sanitiseFields } from './helpers';
import { genId, gen2DKey, gen3DKey, rangeOfKey } from './keys';
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
  mutex?: Promise<any>;

  constructor(params: ObjectTableParams<K>) {
    this.name = params.name;
    this.store = params.store;
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

  async mutexBatch(fn: (batch: LevelUpChain) => Promise<LevelUpChain>): Promise<void> {
    await this.mutex;
    await (this.mutex = (async () => {
      const batch = this.store.batch();
      try {
        await fn(batch);
        await batch.write();
      } finally {
        this.mutex = undefined;
      }
    })());
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

  async getIdByIndex(data: Partial<T>): Promise<string | null> {
    let firstId = data.id;

    for (const fieldName in data) {
      const index = this.index[fieldName];
      if (index !== undefined) {
        const value = data[fieldName];
        const id = await index.lookup(value);

        if (id === null || (firstId !== undefined && firstId !== id)) {
          return null;
        } else {
          firstId = id;
        }
      }
    }

    return firstId;
  }

  async indexObject(id: string, data: Partial<T>, batch: LevelUpChain): Promise<LevelUpChain> {
    let nextBatch = batch;
    for (const fieldName in data) {
      const index = this.index[fieldName];
      if (index !== undefined) {
        nextBatch = await index.index(data[fieldName], data.id, nextBatch);
      }
    }

    return nextBatch;
  }

  async createObject(data: Partial<T>): Promise<T> {
    const id = genId();
    data.id = id;
    data.createdAt = data.updatedAt = new Date().valueOf();

    await this.mutexBatch(async batch => {
      return this.fields.reduce((batch, { name, defaultValue }) => {
        const key = gen3DKey(this.name, id, name);
        const value = data[name];
        const shouldDefault = !!defaultValue && value === null;
        return batch.put(key, shouldDefault ? defaultValue : value);
      }, await this.indexObject(id, data, batch));
    });

    return data as T;
  }
}

export default ObjectTable;
