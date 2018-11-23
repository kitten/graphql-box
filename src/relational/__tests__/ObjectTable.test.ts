import memdown from 'memdown';
import level, { LevelInterface } from '../../level';
import { genId, gen3DKey } from '../keys';
import ObjectTable from '../ObjectTable';

type Test = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  test: string;
};

const name = 'Test';

const fields = [
  {
    name: 'test',
    type: 'String',
    isList: false,
    isRequired: true,
    isUnique: true,
    isReadOnly: false,
  },
] as any;

describe('level/ObjectTable', () => {
  let store: LevelInterface;
  let table: ObjectTable<Test>;

  beforeEach(() => {
    store = level(memdown());
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

  it('can update objects', async () => {
    const id = genId();

    await store.put(gen3DKey(name, id, 'id'), id);
    await store.put(gen3DKey(name, id, 'createdAt'), '1');
    await store.put(gen3DKey(name, id, 'updatedAt'), '2');
    await store.put(gen3DKey(name, id, 'test'), 'manual creation');

    await table.updateObject({ id }, { test: 'updated' });

    expect(await store.get(gen3DKey(name, id, 'test'))).toBe('updated');
    expect(await store.get(gen3DKey(name, id, 'id'))).toBe(id);
    expect(await store.get(gen3DKey(name, id, 'createdAt'))).toBe('1');
    expect(await store.get(gen3DKey(name, id, 'updatedAt'))).not.toBe('2');
  });

  it('can delete objects', async () => {
    const id = genId();

    await store.put(gen3DKey(name, id, 'id'), id);
    await store.put(gen3DKey(name, id, 'createdAt'), '1');
    await store.put(gen3DKey(name, id, 'updatedAt'), '2');
    await store.put(gen3DKey(name, id, 'test'), 'manual creation');

    await table.deleteObject({ id });

    expect(await store.get(gen3DKey(name, id, 'id'))).toBe(null);
    expect(await store.get(gen3DKey(name, id, 'test'))).toBe(null);
    expect(await store.get(gen3DKey(name, id, 'createdAt'))).toBe(null);
    expect(await store.get(gen3DKey(name, id, 'updatedAt'))).toBe(null);
  });

  it('can get objects by id', async () => {
    const id = genId();

    await store.put(gen3DKey(name, id, 'id'), id);
    await store.put(gen3DKey(name, id, 'createdAt'), '1');
    await store.put(gen3DKey(name, id, 'updatedAt'), '2');
    await store.put(gen3DKey(name, id, 'test'), 'manual creation');

    expect(await table.getObject(id)).toEqual({
      id,
      createdAt: new Date(1),
      updatedAt: new Date(2),
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
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      test: 'test-1',
    });
  });

  it('can store then retrieve IDs by indexed values', async () => {
    const expected = await table.createObject({ test: 'test-1' });
    const actualId = await table.getIdByIndex({ test: 'test-1' });
    expect(actualId).toEqual(expected.id);
  });

  it('can store & update, then retrieve IDs by new indexed values', async () => {
    const obj = await table.createObject({ test: 'test-1' });
    const updated = await table.updateObject({ id: obj.id }, { test: 'updated' });

    expect(updated).toEqual({
      ...obj,
      updatedAt: expect.any(Date),
      test: 'updated',
    });

    expect(await table.getIdByIndex({ test: 'test-1' })).toBe(null);
    expect(await table.getIdByIndex({ test: 'updated' })).toBe(obj.id);
    expect(await table.getIdByIndex({ id: updated.id })).toBe(obj.id);
  });

  it('can delete objects and clean up indexed values', async () => {
    const id = genId();

    await store.put(gen3DKey(name, id, 'id'), id);
    await store.put(gen3DKey(name, id, 'createdAt'), '1');
    await store.put(gen3DKey(name, id, 'updatedAt'), '2');
    await store.put(gen3DKey(name, id, 'test'), 'manual creation');

    await table.deleteObject({ id });

    expect(await table.getIdByIndex({ test: 'test-1' })).toBe(null);
    expect(await table.getIdByIndex({ id })).toBe(null);
  });

  it('can iterate over created objects', async () => {
    const data = [{ test: 'x' }, { test: 'y' }, { test: 'z' }];

    await Promise.all(data.map(x => table.createObject(x)));

    let size = 0;
    for await (const item of table.iterator()) {
      expect(item).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        test: expect.any(String),
      });

      size++;
    }

    expect(size).toBe(data.length);
  });

  it('can iterate and abort early', async () => {
    const data = [{ test: 'x' }, { test: 'y' }, { test: 'z' }];

    await Promise.all(data.map(x => table.createObject(x)));

    for await (const item of table.iterator({})) {
      expect(item).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        test: expect.any(String),
      });

      break;
    }
  });
});
