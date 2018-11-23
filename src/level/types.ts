import { AbstractLevelDOWN } from 'abstract-leveldown';
import { AbstractIterator, AbstractIteratorOptions } from 'abstract-leveldown';

export interface LevelChainInterface<K = string, V = string> {
  put(key: K, value: V): this;
  del(key: K): this;
  clear(): this;
  write(): Promise<this>;
}

export interface LevelInterface<K = string, V = string> {
  get(key: K): Promise<V | null>;
  put(key: K, value: V): Promise<void>;
  del(key: K): Promise<void>;
  batch(): LevelChainInterface;
  iterator(options?: AbstractIteratorOptions): AbstractIterator<K, V>;
}

export interface InternalLevelDown extends AbstractLevelDOWN {
  _open: AbstractLevelDOWN['open'];
  _close: AbstractLevelDOWN['close'];
  _get: AbstractLevelDOWN['get'];
  _put: AbstractLevelDOWN['put'];
  _del: AbstractLevelDOWN['del'];
  _batch: AbstractLevelDOWN['batch'];
  _iterator: AbstractLevelDOWN['iterator'];
}
