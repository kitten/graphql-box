import { LevelUp, LevelUpChain } from 'levelup';
import { ObjectFieldIndexParams } from './types';
import { getOrNull } from './helpers';
import { gen3DKey } from './keys';

type ID = string;

class ObjectFieldIndex<T, K> {
  typeName: string;
  fieldName: K;
  store: LevelUp;

  constructor(params: ObjectFieldIndexParams<K>) {
    this.typeName = params.typeName;
    this.fieldName = params.fieldName;
    this.store = params.store;
  }

  lookup(value: T): Promise<string | null> {
    const key = gen3DKey(this.typeName, this.fieldName, value);
    return getOrNull<ID>(this.store, key);
  }

  async index(value: T, id: ID, batch: LevelUpChain) {
    const key = gen3DKey(this.typeName, this.fieldName, value);
    const hasPrev = (await getOrNull<ID>(this.store, key)) !== null;
    if (hasPrev) {
      throw new Error(`Duplicate index value on "${key}"`);
    }

    return batch.put(key, id);
  }
}

export default ObjectFieldIndex;
