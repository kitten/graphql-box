import { LevelInterface, LevelChainInterface } from '../level';
import { ObjectFieldIndexParams, IteratorOptions } from './types';
import { gen2DKey, gen3DKey, rangeOfKey } from './keys';
import AsyncIdIterator from './AsyncIdIterator';

class ObjectFieldOrdinal<K> {
  name: string;
  store: LevelInterface;

  constructor(params: ObjectFieldIndexParams<K>) {
    this.name = gen2DKey(params.typeName, params.fieldName);
    this.store = params.store;
  }

  unindex(value: string, id: string, batch: LevelChainInterface): LevelChainInterface {
    const key = gen3DKey(this.name, value, id);
    return batch.del(key);
  }

  index(value: string, id: string, batch: LevelChainInterface) {
    const key = gen3DKey(this.name, value, id);
    return batch.put(key, id);
  }

  reindex(prev: string, value: string, id: string, batch: LevelChainInterface) {
    return this.index(value, id, this.unindex(prev, id, batch));
  }

  iterator(value: string, { reverse = false, limit = -1 }: IteratorOptions = {}) {
    const { name, store } = this;
    const range = rangeOfKey(gen2DKey(name, value));
    range.reverse = reverse;
    range.limit = limit;
    const iterator = store.iterator(range);
    return new AsyncIdIterator(iterator);
  }
}

export default ObjectFieldOrdinal;
