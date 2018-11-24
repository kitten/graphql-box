import { EncoderList, Iterator, ObjectLike } from './types';
import { nextObjectOrNull } from './helpers';
import AsyncLevelIterator from './AsyncLevelIterator';

class AsyncObjectIterator<T extends ObjectLike, K extends keyof T> extends AsyncLevelIterator<T> {
  fieldNames: K[];
  encoderList: EncoderList<T>;

  constructor(fieldNames: K[], encoderList: EncoderList<T>, iterator: Iterator) {
    super(iterator);
    this.fieldNames = fieldNames;
    this.encoderList = encoderList;
  }

  nextOrNull(): Promise<null | T> {
    return nextObjectOrNull<T, K>(this.fieldNames, this.encoderList, this.iterator);
  }
}

export default AsyncObjectIterator;
