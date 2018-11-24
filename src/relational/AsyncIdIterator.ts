import { nextOrNull } from './helpers';
import AsyncLevelIterator from './AsyncLevelIterator';

class AsyncIdIterator extends AsyncLevelIterator<string> {
  async nextOrNull(): Promise<null | string> {
    const entry = await nextOrNull(this.iterator);
    return entry !== null ? entry[1] : null;
  }
}

export default AsyncIdIterator;
