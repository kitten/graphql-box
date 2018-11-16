import { LevelUp } from 'levelup';
import { ObjectLike, ObjectTableParams, ObjectFieldDefinition, IteratorOptions } from './types';
import { getOrNull, nextObjectOrNull, sanitiseFields } from './helpers';
import { genId, gen2DKey, gen3DKey, rangeOfKey } from './keys';
import ObjectAsyncIterator from './ObjectAsyncIterator';

const DEFAULT_ITER_OPTS = {
  reverse: false,
  limit: -1,
};

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

  iterator({ reverse, limit }: IteratorOptions = DEFAULT_ITER_OPTS): ObjectAsyncIterator<T, K> {
    const range = rangeOfKey(this.name);
    range.reverse = reverse;
    range.limit = limit > 0 ? limit * this.fieldsLength : limit;
    return new ObjectAsyncIterator<T, K>(this.name, this.fieldNames, this.store.iterator(range));
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

  async createObject(data: Partial<T>) {
    data.id = genId();
    data.createdAt = data.updatedAt = new Date().valueOf();

    const batch = this.fieldNames.reduce((batch, fieldName) => {
      const key = gen3DKey(this.name, data.id, fieldName);
      return batch.put(key, data[fieldName]);
    }, this.store.batch());

    await batch.write();
    return data;
  }
}

export default ObjectTable;
