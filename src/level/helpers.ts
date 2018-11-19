import { LevelUp } from 'levelup';
import { AbstractIterator } from 'abstract-leveldown';
import { ObjectLike, ObjectFieldDefinition, Entry } from './types';

export const getOrNull = async <V>(db: LevelUp, key: string): Promise<V | null> => {
  try {
    const value: V = await db.get(key);
    return value;
  } catch (err) {
    if (err.notFound) {
      return null;
    }

    throw err;
  }
};

export const nextOrNull = <T extends ObjectLike, K extends keyof T>(
  iter: AbstractIterator<K, T[K]>
): Promise<Entry<K, T[K]> | null> =>
  new Promise((resolve, reject) => {
    iter.next((err, key: K, value: T[K]) => {
      if (err) {
        iter.end(() => reject(err));
      } else if (key === undefined) {
        resolve(null);
      } else {
        resolve([key, value]);
      }
    });
  });

export const closeIter = (iter: AbstractIterator<any, any>) =>
  new Promise((resolve, reject) => {
    iter.end(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

export const objectOfFields = <T, K extends keyof T>(keys: K[], vals: T[K][]): T => {
  const res = {} as T;

  for (let i = 0, s = keys.length; i < s; i++) {
    res[keys[i]] = vals[i];
  }

  return res;
};

export const nextObjectOrNull = async <T extends ObjectLike, K extends keyof T>(
  keys: K[],
  iter: AbstractIterator<K, T[K]>
): Promise<T | null> => {
  const res = {} as T;

  for (let i = 0, s = keys.length; i < s; i++) {
    const entry = await nextOrNull<T, K>(iter);
    if (entry === null) {
      return null;
    } else {
      res[keys[i]] = entry[1];
    }
  }

  return res;
};

export const sanitiseFields = <T extends ObjectLike, K extends keyof T>(
  fields: ObjectFieldDefinition<K>[]
) => {
  const sparseFields: ObjectFieldDefinition<K>[] = fields.filter(({ name }) => {
    return name !== 'id' && name !== 'createdAt' && name !== 'updatedAt';
  });

  const withSystemFields = [
    // id is marked as non-unique here, however, that's simply to prevent
    // it from being indexed unnecessarily
    { name: 'id', isUnique: false, isReadOnly: true },
    { name: 'createdAt', isUnique: false, isReadOnly: true },
    { name: 'updatedAt', isUnique: false, isReadOnly: true },
    ...sparseFields,
  ].sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });

  return withSystemFields as ObjectFieldDefinition<K>[];
};
