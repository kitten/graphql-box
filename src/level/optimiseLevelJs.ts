import { AbstractLevelDOWN } from 'abstract-leveldown';

function identity<T>(arg: T): T {
  return arg;
}

// gqlvl guarantees stringified keys and values, so this
// gets rid of level-js' default serialisation
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
