import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { batchPositionIssues, validateDraft } from "../src/lib/draft-validator";

const root = "content/drafts";
let bad = 0;
for (const batch of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const texts: string[] = [];
  for (const f of readdirSync(join(root, batch.name)).filter((n) => n.endsWith(".md"))) {
    const text = readFileSync(join(root, batch.name, f), "utf8");
    texts.push(text);
    const issues = validateDraft(text);
    if (issues.length) { bad++; console.error(`✗ ${batch.name}/${f}`); for (const i of issues) console.error(`   [${i.rule}] ${i.message}`); }
    else console.log(`✓ ${batch.name}/${f}`);
  }
  for (const i of batchPositionIssues(texts)) { bad++; console.error(`✗ ${batch.name} [${i.rule}] ${i.message}`); }
}
process.exit(bad ? 1 : 0);
