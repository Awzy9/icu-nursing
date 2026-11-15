// A Supabase session is a few kilobytes of JSON, more than a single secure-store value should hold. This adapter splits it across several
// secure-store keys (Keychain on iOS, Keystore-backed on Android). The platform does the encryption; nothing here rolls its own crypto.
export interface SecureValueStore { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void>; remove(key: string): Promise<void> }
export interface AsyncStorageLike { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> }

export const CHUNK_SIZE = 1800;
const safeKey = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, "_"); // secure-store keys may only use these characters

export function createChunkedStorage(store: SecureValueStore, chunkSize = CHUNK_SIZE): AsyncStorageLike {
  const countKey = (k: string) => `${safeKey(k)}.n`;
  const chunkKey = (k: string, i: number) => `${safeKey(k)}.${i}`;
  async function removeAll(key: string) {
    const n = Number((await store.get(countKey(key))) ?? 0);
    for (let i = 0; i < (Number.isFinite(n) ? n : 0); i++) await store.remove(chunkKey(key, i));
    await store.remove(countKey(key));
  }
  return {
    async getItem(key) {
      const n = Number(await store.get(countKey(key)));
      if (!Number.isInteger(n) || n <= 0 || n > 100) return null;
      let out = "";
      for (let i = 0; i < n; i++) { const part = await store.get(chunkKey(key, i)); if (part === null) return null; out += part; } // a torn write reads as "no session"
      return out;
    },
    async setItem(key, value) {
      await removeAll(key);
      const parts = Math.ceil(value.length / chunkSize);
      for (let i = 0; i < parts; i++) await store.set(chunkKey(key, i), value.slice(i * chunkSize, (i + 1) * chunkSize));
      await store.set(countKey(key), String(parts));
    },
    removeItem: removeAll,
  };
}
