import levelup, { LevelUp } from 'levelup';
import encode from 'encoding-down';
import memdown from 'memdown';

import { getOrNull, nextOrNull, closeIter, objectOfFields } from '../helpers';

describe('level/helpers', () => {
  let store: LevelUp;

  beforeEach(() => {
    store = levelup(encode(memdown(), { keyEncoding: 'none', valueEncoding: 'json' }));
  });

  describe('getOrNull', () => {
    it('works', async () => {
      const entry = ['test-key', 'test-value'];
      await store.put(...entry);
      const val = await getOrNull(store, entry[0]);
      expect(val).toBe(entry[1]);
      const nothing = await getOrNull(store, 'bogus');
      expect(nothing).toBe(null);
    });
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

  describe('objectOfFields', () => {
    it('works', () => {
      const keys = ['a', 'b', 'c'];
      const vals = ['1', '2', '3'];
      expect(objectOfFields<any, string>(keys, vals)).toEqual({ a: '1', b: '2', c: '3' });
    });
  });
});
