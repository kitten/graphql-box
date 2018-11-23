import memdown from 'memdown';
import level, { LevelInterface } from '../../level';
import { mutexBatchFactory, MutexBatch } from '../mutexBatch';

describe('level/mutexBatch', () => {
  let store: LevelInterface;
  let mutexBatch: MutexBatch;

  beforeEach(() => {
    store = level(memdown());
    mutexBatch = mutexBatchFactory(store);
  });

  it('runs a batch', async () => {
    await mutexBatch(batch => {
      return batch.put('test-key', 'test-val');
    });

    expect(await store.get('test-key')).toBe('test-val');
  });

  it('runs multiple batches in series', async () => {
    await store.put('test', '1');

    await Promise.all([
      mutexBatch(async batch => {
        expect(await store.get('test')).toBe('1');
        await store.put('test', '2');
        return batch.put('test-key', 'first');
      }),
      mutexBatch(async batch => {
        expect(await store.get('test')).toBe('2');
        await store.put('test', '3');
        return batch.put('test-key', 'second');
      }),
    ]);

    expect(await store.get('test-key')).toBe('second');
    expect(await store.get('test')).toBe('3');
  });
});
