import { AbstractLevelDOWN } from 'abstract-leveldown';
export interface DeferredLevelDOWN<K, V> extends AbstractLevelDOWN<K, V> {}

export interface DeferredLevelDOWNConstructor {
  new <K, V>(): DeferredLevelDOWN<K, V>;
}

export default DeferredLevelDOWNConstructor;
