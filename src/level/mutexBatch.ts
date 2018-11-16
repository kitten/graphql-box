import { LevelUp, LevelUpChain } from 'levelup';

export interface MutexBatch {
  (fn: (batch: LevelUpChain) => Promise<LevelUpChain>): Promise<void>;
}

export const mutexBatchFactory = (store: LevelUp): MutexBatch => {
  let mutex: void | Promise<void>;

  return async function mutexBatch(fn: (batch: LevelUpChain) => Promise<LevelUpChain>) {
    if (mutex !== undefined) {
      await mutex;
    }

    await (mutex = (async () => {
      const batch = store.batch();
      try {
        await fn(batch);
        await batch.write();
      } finally {
        mutex = undefined;
      }
    })());
  };
};
