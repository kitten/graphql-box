type OriginalFn = (...args: any[]) => void;

type PromiseFn = (<T>() => Promise<T>) &
  (<T, A>(A) => Promise<T>) &
  (<T, A, B>(A, B) => Promise<T>);

export function promisify(f: OriginalFn): PromiseFn {
  function promisified(...args) {
    return new Promise((resolve, reject) => {
      function callback(err, value) {
        if (err !== null && err !== undefined) {
          reject(err);
        } else {
          resolve(value);
        }
      }

      f.call(this, ...args, callback);
    });
  }

  return promisified as PromiseFn;
}
