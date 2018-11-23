import { LevelInterface, LevelChainInterface } from '../level';

type BatchFn = (batch: LevelChainInterface) => LevelChainInterface | Promise<LevelChainInterface>;

export interface MutexBatch {
  (fn: BatchFn): Promise<void>;
}

export const mutexBatchFactory = (store: LevelInterface): MutexBatch => {
  let mutex: void | Promise<void>;

  return async function mutexBatch(fn: BatchFn) {
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
