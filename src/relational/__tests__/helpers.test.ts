import levelup, { LevelUp } from 'levelup';
import encode from 'encoding-down';
import memdown from 'memdown';

import { nextOrNull, closeIter } from '../helpers';

describe('level/helpers', () => {
  let store: LevelUp;

  beforeEach(() => {
    store = levelup(encode(memdown(), { keyEncoding: 'none', valueEncoding: 'json' }));
  });

  describe('nextOrNull & closeIter', () => {
    it('works', async () => {
      const entryA = ['test-key-1', 'test-value-1'];
      const entryB = ['test-key-2', 'test-value-2'];
      await Promise.all([store.put(...entryA), store.put(...entryB)]);
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
