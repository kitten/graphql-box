import { AbstractIterator } from 'abstract-leveldown';
import { ObjectLike } from './types';
import { nextObjectOrNull, closeIter } from './helpers';

class ObjectAsyncIterator<T extends ObjectLike, K extends keyof T>
  implements AsyncIterableIterator<T> {
  name: string;
  fieldNames: K[];
  iterator: AbstractIterator<K, T[K]>;
  done: boolean;

  constructor(name: string, fieldNames: K[], iterator: AbstractIterator<K, T[K]>) {
    this.name = name;
    this.fieldNames = fieldNames;
    this.iterator = iterator;
    this.done = false;
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.done) {
      return { done: true } as IteratorResult<T>;
    }

    const value = await nextObjectOrNull<T, K>(this.fieldNames, this.iterator);
    if (value === null) {
      return { done: this.done = true } as any;
    }

    return { done: false, value };
  }

  async return() {
    await closeIter(this.iterator);
    return { done: true } as IteratorResult<T>;
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

export default ObjectAsyncIterator;
