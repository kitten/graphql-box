import { EncoderList, Iterator, ObjectLike } from './types';
import { nextObjectOrNull, closeIter } from './helpers';

class AsyncObjectIterator<T extends ObjectLike, K extends keyof T>
  implements AsyncIterableIterator<T> {
  fieldNames: K[];
  encoderList: EncoderList<T>;
  iterator: Iterator;
  done: boolean;

  constructor(fieldNames: K[], encoderList: EncoderList<T>, iterator: Iterator) {
    this.fieldNames = fieldNames;
    this.encoderList = encoderList;
    this.iterator = iterator;
    this.done = false;
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.done) {
      return { done: true } as IteratorResult<T>;
    }

    const value = await nextObjectOrNull<T, K>(this.fieldNames, this.encoderList, this.iterator);
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

export default AsyncObjectIterator;
