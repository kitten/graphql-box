type OriginalFn = (...args: any[]) => void;

type PromiseFn = (<T>() => Promise<T>) &
  (<T, A>(A) => Promise<T>) &
  (<T, A, B>(A, B) => Promise<T>);

export function promisify(f: OriginalFn): PromiseFn {
  function promisified(...args) {
    return new Promise((resolve, reject) => {
      args.push(function callback(err, value) {
        if (err !== null) {
          reject(err);
        } else {
          resolve(value);
        }
      });

      f.call(this, ...args);
    });
  }

  return promisified as PromiseFn;
}
