import levelup, { LevelUp } from 'levelup';
import encode from 'encoding-down';
import memdown from 'memdown';

import { genId, gen3DKey } from '../keys';
import ObjectTable from '../ObjectTable';

type Test = {
  id: string;
  createdAt: number;
  updatedAt: number;
  test: string;
};

const name = 'Test';

const fields = [{ name: 'test', index: false, writeable: true }] as any;

describe('level/ObjectTable', () => {
  let store: LevelUp;
  let table: ObjectTable<Test>;

  beforeEach(() => {
    store = levelup(encode(memdown(), { keyEncoding: 'none', valueEncoding: 'json' }));
    table = new ObjectTable({ name, store, fields });
  });

  it('can create objects', async () => {
    const dataA = await table.createObject({
      id: 'should be replaced',
      test: 'test-1',
    });

    const dataB = await table.createObject({
      id: 'should be replaced',
      test: 'test-2',
    });

    expect(dataB.test).toBe('test-2');
    expect(dataB.id.length).toBe(25);
    expect(await store.get(gen3DKey(name, dataB.id, 'test'))).toBe('test-2');

    expect(dataA.test).toBe('test-1');
    expect(dataA.id.length).toBe(25);
    expect(await store.get(gen3DKey(name, dataA.id, 'test'))).toBe('test-1');
  });

  it('can get fields by name and id', async () => {
    const id = genId();
    await store.put(gen3DKey(name, id, 'id'), id);
    expect(await table.getField(id, 'id')).toBe(id);
  });

  it('can get objects by id', async () => {
    const id = genId();

    await store.put(gen3DKey(name, id, 'id'), id);
    await store.put(gen3DKey(name, id, 'createdAt'), 1);
    await store.put(gen3DKey(name, id, 'updatedAt'), 2);
    await store.put(gen3DKey(name, id, 'test'), 'manual creation');

    expect(await table.getObject(id)).toEqual({
      id,
      createdAt: 1,
      updatedAt: 2,
      test: 'manual creation',
    });
  });

  it('can store then retrieve objects', async () => {
    const data = await table.createObject({
      id: 'should be replaced',
      test: 'test-1',
    });

    const actual = await table.getObject(data.id);

    expect(actual).toEqual(data);
    expect(actual).toEqual({
      id: expect.any(String),
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      test: 'test-1',
    });
  });

  it('can iterate over created objects', async () => {
    const data = [{ test: 'x' }, { test: 'x' }, { test: 'x' }];

    await Promise.all(data.map(x => table.createObject(x)));

    let size = 0;
    for await (const item of table.iterator()) {
      expect(item).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
        test: 'x',
      });

      size++;
    }

    expect(size).toBe(data.length);
  });
});
