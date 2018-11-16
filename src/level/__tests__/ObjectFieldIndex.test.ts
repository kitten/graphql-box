import levelup, { LevelUp } from 'levelup';
import encode from 'encoding-down';
import memdown from 'memdown';

import { genId, gen3DKey } from '../keys';
import ObjectFieldIndex from '../ObjectFieldIndex';

const typeName = 'Type';
const fieldName = 'field';

describe('level/ObjectFieldIndex', () => {
  let store: LevelUp;
  let index: ObjectFieldIndex<string, string>;

  beforeEach(() => {
    store = levelup(encode(memdown(), { keyEncoding: 'none', valueEncoding: 'json' }));
    index = new ObjectFieldIndex<string, string>({ typeName, fieldName, store });
  });

  it('can retrieve indexed values', async () => {
    const id = genId();
    const value = 'test';
    await store.put(gen3DKey(typeName, fieldName, value), id);
    const actual = await index.lookup(value);
    expect(actual).toBe(id);
  });

  it('can index values', async () => {
    const id = genId();
    const value = 'test';
    await (await index.index(value, id, store.batch())).write();
    const actual = await store.get(gen3DKey(typeName, fieldName, value));
    expect(actual).toBe(id);
  });

  it('can index and lookup values', async () => {
    const id = genId();
    const value = 'test';

    await (await index.index(value, id, store.batch())).write();
    const actual = await index.lookup(value);

    expect(actual).toBe(id);
  });

  it('throws when a value is already indexed', async () => {
    expect.assertions(1);

    const id = genId();
    const value = 'test';

    await store.put(gen3DKey(typeName, fieldName, value), id);

    try {
      await (await index.index(value, id, store.batch())).write();
    } catch (err) {
      expect(err).toMatchInlineSnapshot(`[Error: Duplicate index value on "Type!field!test"]`);
    }
  });
});
