import { LevelInterface, LevelChainInterface } from '../level';
import { ObjectFieldIndexParams, IteratorOptions } from './types';
import { gen2DKey, rangeOfKey } from './keys';
import AsyncIdIterator from './AsyncIdIterator';

class ObjectFieldIndex<K> {
  name: string;
  store: LevelInterface;

  constructor(params: ObjectFieldIndexParams<K>) {
    this.name = gen2DKey(params.typeName, params.fieldName);
    this.store = params.store;
  }

  lookup(value: string): Promise<string | null> {
    const key = gen2DKey(this.name, value);
    return this.store.get(key);
  }

  unindex(value: string, id: string, batch: LevelChainInterface): LevelChainInterface {
    const key = gen2DKey(this.name, value);
    return batch.del(key);
  }

  async index(value: string, id: string, batch: LevelChainInterface): Promise<LevelChainInterface> {
    const key = gen2DKey(this.name, value);
    const prev = await this.store.get(key);
    if (prev !== null) {
      throw new Error(`Duplicate index value on "${key}"`);
    }

    return batch.put(key, id);
  }

  reindex(
    prev: string,
    value: string,
    id: string,
    batch: LevelChainInterface
  ): Promise<LevelChainInterface> {
    return this.index(value, id, this.unindex(prev, id, batch));
  }

  iterator({ reverse = false, limit = -1 }: IteratorOptions = {}) {
    const { name, store } = this;
    const range = rangeOfKey(name);
    range.reverse = reverse;
    range.limit = limit;
    const iterator = store.iterator(range);
    return new AsyncIdIterator(iterator);
  }
}

export default ObjectFieldIndex;
