import { LevelInterface, LevelChainInterface } from '../level';
import { ObjectFieldIndexParams } from './types';
import { gen2DKey } from './keys';

class ObjectFieldIndex<K> {
  name: string;
  store: LevelInterface;

  constructor(params: ObjectFieldIndexParams<K>) {
    this.name = gen2DKey(params.typeName, params.fieldName);
    this.store = params.store;
  }

  lookup(value: string): Promise<string | null> {
    if (value === null) {
      return null;
    }

    const key = gen2DKey(this.name, value);
    return this.store.get(key);
  }

  unindex(value: string, id: string, batch: LevelChainInterface): LevelChainInterface {
    if (value === null) {
      return batch;
    }

    const key = gen2DKey(this.name, value);
    return batch.del(key);
  }

  async index(value: string, id: string, batch: LevelChainInterface): Promise<LevelChainInterface> {
    if (value === null) {
      return batch;
    }

    const key = gen2DKey(this.name, value);
    const prev = await this.store.get(key);
    if (prev !== null) {
      throw new Error(`Duplicate index value on "${key}"`);
    }

    return batch.put(key, id);
  }

  async reindex(
    prev: string,
    value: string,
    id: string,
    batch: LevelChainInterface
  ): Promise<LevelChainInterface> {
    return this.unindex(prev, id, await this.index(value, id, batch));
  }
}

export default ObjectFieldIndex;
