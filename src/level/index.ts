import { AbstractLevelDOWN, AbstractIteratorOptions, AbstractIterator } from 'abstract-leveldown';

import DeferredLevelDOWN from 'deferred-leveldown';

import { promisify } from '../utils/promisify';
import { LevelInterface, LevelChainInterface, InternalLevelDown } from './types';
import { optimiseLevelJs } from './optimiseLevelJs';

type K = string;
type V = string;

function noop() {}

export class LevelWrapper implements LevelInterface<K, V> {
  db: InternalLevelDown;
  open: () => Promise<void>;
  close: () => Promise<void>;
  put: (key: K, value: V) => Promise<void>;
  del: (key: K) => Promise<void>;
  _get: (K, AbstractGetOptions) => Promise<V>;

  constructor(db: AbstractLevelDOWN) {
    this.db = new DeferredLevelDOWN(optimiseLevelJs(db)) as InternalLevelDown;
    this.put = promisify(this.db.put).bind(this.db);
    this.del = promisify(this.db.del).bind(this.db);
    this._get = promisify(this.db.get).bind(this.db);

    this.db.open(
      {
        createIfMissing: true,
        errorIfExists: false,
      },
      noop
    );
  }

  async get(key: K): Promise<V | null> {
    try {
      return await this._get(key, { asBuffer: false });
    } catch (_err) {
      return null;
    }
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

export { LevelInterface, LevelChainInterface };
export default level;
