import { AbstractIterator } from 'abstract-leveldown';
import { FieldDefinition, Deserializer } from '../internal';
import { ObjectLike } from './types';

export const nextOrNull = (
  iter: AbstractIterator<string, string>
): Promise<[string, string] | null> =>
  new Promise((resolve, reject) => {
    iter.next((err, key: void | string, value: string) => {
      if (err) {
        iter.end(() => reject(err));
      } else if (key === undefined) {
        resolve(null);
      } else {
        resolve([key as string, value]);
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

export const nextObjectOrNull = async <T extends ObjectLike, K extends keyof T>(
  keys: K[],
  decoders: Deserializer<T[K]>[],
  iter: AbstractIterator<string, string>
): Promise<T | null> => {
  const res = {} as T;

  for (let i = 0, s = keys.length; i < s; i++) {
    const entry = await nextOrNull(iter);
    if (entry === null) {
      return null;
    } else {
      res[keys[i]] = decoders[i](entry[1]) as T[K];
    }
  }

  return res;
};

export const sortFields = <K>(fields: FieldDefinition<K>[]): FieldDefinition<K>[] => {
  return fields.slice().sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });
};
