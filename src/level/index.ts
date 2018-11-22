import { AbstractLevelDOWN, AbstractIteratorOptions, AbstractIterator } from 'abstract-leveldown';

import { promisify } from '../utils/promisify';
import { LevelInterface, LevelChainInterface, InternalLevelDown } from './types';
import { optimiseLevelJs } from './optimiseLevelJs';

type K = string;
type V = string;

export class LevelWrapper implements LevelInterface<K, V> {
  db: InternalLevelDown;
  open: () => Promise<void>;
  close: () => Promise<void>;
  put: (key: K, value: V) => Promise<void>;
  del: (key: K) => Promise<void>;
  _get: (K, AbstractGetOptions) => Promise<V>;

  constructor(db: AbstractLevelDOWN) {
    this.db = optimiseLevelJs(db) as InternalLevelDown;
    this.put = promisify(this.db._put).bind(this.db);
    this.del = promisify(this.db._del).bind(this.db);
    this._get = promisify(this.db._get).bind(this.db);
  }

  get(key: K): Promise<V> {
    return this._get(key, { asBuffer: false });
  }

  iterator(options: AbstractIteratorOptions = {}): AbstractIterator<K, V> {
    options.keyAsBuffer = false;
    options.valueAsBuffer = false;
    return this.db.iterator(options);
  }

  batch(): LevelChainInterface {
    const batch = this.db.batch();
    batch.write = promisify(batch.write).bind(batch);
    return batch as LevelChainInterface;
  }
}

const level = (db: AbstractLevelDOWN) => new LevelWrapper(db);

export default level;
