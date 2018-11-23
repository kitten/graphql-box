import memdown from 'memdown';
import level, { LevelInterface } from '../../level';
import { nextOrNull, closeIter } from '../helpers';

describe('level/helpers', () => {
  let store: LevelInterface;

  beforeEach(() => {
    store = level(memdown());
  });

  describe('nextOrNull & closeIter', () => {
    it('works', async () => {
      const entryA = ['test-key-1', 'test-value-1'];
      const entryB = ['test-key-2', 'test-value-2'];
      await Promise.all([store.put(entryA[0], entryA[1]), store.put(entryB[0], entryB[1])]);
      const iterator = store.iterator();

      const output = [
        await nextOrNull(iterator),
        await nextOrNull(iterator),
        await nextOrNull(iterator),
      ];

      expect(output).toEqual([entryA, entryB, null]);

      await closeIter(iterator);
    });
  });
});
