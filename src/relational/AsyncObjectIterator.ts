import { Deserializer } from '../internal';
import { Iterator, ObjectLike } from './types';
import { nextObjectOrNull } from './helpers';
import AsyncLevelIterator from './AsyncLevelIterator';

class AsyncObjectIterator<T extends ObjectLike, K extends keyof T> extends AsyncLevelIterator<T> {
  fieldNames: K[];
  decoders: Deserializer<T[K]>[];

  constructor(fieldNames: K[], decoders: Deserializer<T[K]>[], iterator: Iterator) {
    super(iterator);
    this.fieldNames = fieldNames;
    this.decoders = decoders;
  }

  nextOrNull(): Promise<null | T> {
    return nextObjectOrNull<T, K>(this.fieldNames, this.decoders, this.iterator);
  }
}

export default AsyncObjectIterator;
