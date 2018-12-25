import { AbstractLevelDOWN } from 'abstract-leveldown';

function identity<T>(arg: T): T {
  return arg;
}

// We only store string keys and values
// So we can replace the serialize functions on level-js
export function optimiseLevelJs(db: AbstractLevelDOWN): AbstractLevelDOWN {
  const obj = db as any;

  if (
    typeof obj.store === 'function' &&
    typeof obj.await === 'function' &&
    typeof obj.destroy === 'function'
  ) {
    obj._serializeKey = identity;
    obj._serializeValue = identity;
  }

  return db;
}
