import { AbstractIterator } from 'abstract-leveldown';
import { ObjectLike, Entry } from './types';
import { nextOrNull, closeIter } from './helpers';
import { idOfKey, fieldOfKey } from './keys';

class ObjectAsyncIterator<T extends ObjectLike, K extends keyof T>
  implements AsyncIterableIterator<T> {
  iterator: AbstractIterator<K, T[K]>;
  active: boolean;
  name: string;
  entry?: null | Entry<K, T[K]>;

  constructor(name: string, iterator: AbstractIterator<K, T[K]>) {
    this.name = name;
    this.active = true;
    this.iterator = iterator;
  }

  async next(): Promise<IteratorResult<T>> {
    if (!this.active) {
      return { done: true } as IteratorResult<T>;
    } else if (this.entry === undefined) {
      this.entry = await nextOrNull<T, K>(this.iterator);
    }

    const { name, entry } = this;
    const id = idOfKey(name, entry[0]);
    const value = {} as T;

    do {
      const fieldName = fieldOfKey(name, entry[0]);
      value[fieldName] = entry[1];
      this.entry = await nextOrNull<T, K>(this.iterator);
    } while ((this.active = entry !== null) && idOfKey(name, entry[0]) === id);

    return { done: !this.active, value };
  }

  return() {
    return closeIter(this.iterator);
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

export default ObjectAsyncIterator;
