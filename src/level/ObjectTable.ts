import { LevelUp } from 'levelup';
import { ObjectLike, ObjectTableParams, ObjectFieldDefinition, IteratorOptions } from './types';
import { getOrNull, nextObjectOrNull, sanitiseFields } from './helpers';
import { genId, gen2DKey, gen3DKey, rangeOfKey } from './keys';
import ObjectAsyncIterator from './ObjectAsyncIterator';

class ObjectTable<T extends ObjectLike, K extends keyof T = keyof T> {
  name: string;
  fields: ObjectFieldDefinition<K>[];
  fieldNames: K[];
  fieldsLength: number;
  store: LevelUp;

  constructor(params: ObjectTableParams<K>) {
    this.name = params.name;
    this.store = params.store;

    this.fields = sanitiseFields<T, K>(params.fields);
    this.fieldNames = this.fields.map(x => x.name);
    this.fieldsLength = this.fields.length;
  }

  iterator({ reverse = false, limit = -1 }: IteratorOptions = {}): ObjectAsyncIterator<T, K> {
    const { store, name, fieldsLength, fieldNames } = this;
    const range = rangeOfKey(name);
    range.reverse = reverse;
    range.limit = limit > 0 ? limit * fieldsLength : limit;
    const iterator = store.iterator(range);
    return new ObjectAsyncIterator<T, K>(name, fieldNames, iterator);
  }

  getField(id: string, fieldName: K): Promise<T[K] | null> {
    const key = gen3DKey(this.name, id, fieldName);
    return getOrNull<T[K]>(this.store, key);
  }

  getObject(id: string) {
    const range = rangeOfKey(gen2DKey(this.name, id));
    const iterator = this.store.iterator(range);
    return nextObjectOrNull<T, K>(this.fieldNames, iterator);
  }

  async createObject(data: Partial<T>): Promise<T> {
    data.id = genId();
    data.createdAt = data.updatedAt = new Date().valueOf();

    const batch = this.fields.reduce((batch, { name, defaultValue }) => {
      const key = gen3DKey(this.name, data.id, name);
      const value = data[name];
      const shouldDefault = defaultValue !== null && value === null;
      return batch.put(key, shouldDefault ? defaultValue : value);
    }, this.store.batch());

    await batch.write();
    return data as T;
  }
}

export default ObjectTable;
