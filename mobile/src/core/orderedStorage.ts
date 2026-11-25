import type { KeyValueStore } from "./progress";

// Wrap the underlying store once, before adding account prefixes. Operations
// for a single physical key remain ordered across sign-out and sign-in, while
// unrelated accounts can continue independently.
export function orderedStorage(base: KeyValueStore): KeyValueStore {
  const tails = new Map<string, Promise<void>>();
  function run<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const result = (tails.get(key) ?? Promise.resolve()).then(operation);
    const tail = result.then(() => undefined, () => undefined);
    tails.set(key, tail);
    void tail.then(() => { if (tails.get(key) === tail) tails.delete(key); });
    return result;
  }
  return {
    get: key => run(key, () => base.get(key)),
    set: (key, value) => run(key, () => base.set(key, value)),
    remove: key => run(key, () => base.remove(key)),
  };
}
