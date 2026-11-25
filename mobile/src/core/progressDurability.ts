import type { KeyValueStore, Progress } from "./progress";

// A write acknowledgement belongs to one exact snapshot and one storage scope.
// A stale successful write must never certify a newer, failed, or switched-account snapshot.
export function createProgressDurability() {
  type Record = { scope: KeyValueStore; snapshot: Progress; saved: Promise<boolean> };
  let current: Record | undefined;
  return {
    hydrated(scope: KeyValueStore, snapshot: Progress) {
      current = { scope, snapshot, saved: Promise.resolve(true) };
    },
    writing(scope: KeyValueStore, snapshot: Progress, write: Promise<void>): Promise<boolean> {
      const saved = write.then(() => true, () => false);
      current = { scope, snapshot, saved };
      return saved;
    },
    async confirmed(scope: KeyValueStore, snapshot: Progress): Promise<boolean> {
      const record = current;
      if (!record || record.scope !== scope || record.snapshot !== snapshot) return false;
      const ok = await record.saved;
      return ok && current === record;
    },
  };
}
