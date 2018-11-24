import { Iterator } from './types';
import { closeIter } from './helpers';

abstract class AsyncLevelIterator<T> implements AsyncIterableIterator<T> {
  iterator: Iterator;
  done: boolean;

  constructor(iterator: Iterator) {
    this.iterator = iterator;
    this.done = false;
  }

  abstract nextOrNull(): Promise<null | T>;

  async next(): Promise<IteratorResult<T>> {
    if (this.done) {
      return { done: true } as IteratorResult<T>;
    }

    const value = await this.nextOrNull();
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

export default AsyncLevelIterator;
