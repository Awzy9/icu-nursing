/** Runs Supabase's security + performance advisors for the dev project and prints a compact summary. */
import { api } from "./mgmt";

interface Lint { name: string; level: string; detail: string; remediation?: string }
(async () => {
  for (const kind of ["security", "performance"] as const) {
    const { lints } = await api<{ lints: Lint[] }>(`/advisors/${kind}`);
    const groups = new Map<string, Lint[]>();
    for (const l of lints) groups.set(`${l.level}  ${l.name}`, [...(groups.get(`${l.level}  ${l.name}`) ?? []), l]);
    console.log(`\n=== ${kind.toUpperCase()} advisor: ${lints.length} finding(s) ===`);
    for (const [k, v] of [...groups].sort()) {
      console.log(`${k}  (x${v.length})`);
      for (const l of v) console.log(`    - ${l.detail.replace(/\\`/g, "`").slice(0, 170)}`);
    }
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
