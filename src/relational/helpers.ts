import { AbstractIterator } from 'abstract-leveldown';
import { ObjectLike, EncoderList } from './types';

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
  encoders: EncoderList<T>,
  iter: AbstractIterator<string, string>
): Promise<T | null> => {
  const res = {} as T;

  for (let i = 0, s = keys.length; i < s; i++) {
    const entry = await nextOrNull(iter);
    if (entry === null) {
      return null;
    } else {
      res[keys[i]] = encoders[i].deserializer(entry[1]) as T[K];
    }
  }

  return res;
};
