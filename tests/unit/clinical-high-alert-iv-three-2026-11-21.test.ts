import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const records = [
  ["MD-33", "MD-33-labetalol.json"],
  ["MD-34", "MD-34-esmolol.json"],
  ["MD-37", "MD-37-lorazepam.json"],
] as const;

describe("high-alert IV beta-blocker and lorazepam draft classification", () => {
  it("includes route-limited high-alert flags and never marks a clinical approval", () => {
    const register=read("docs/clinical-evidence/AI_REVIEW_HIGH_ALERT_IV_THREE_2026-11-21.md");
    expect(register).toContain("www.ismp.org/system/files/resources/2024-01/");
    for (const [id,file] of records) {
      const d=JSON.parse(read(`content/drafts/medications/${file}`));
      expect(d.high_alert,id).toBe(true);
      expect(d.high_alert_note).toContain("ISMP");
      expect(d.high_alert_note).toContain("IV");
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
      expect(d.sources.every((v:{id:string})=>v.id!=="S-ISMP-HAM-2024")).toBe(true);
    }
  });
  it("retains correct hashes, revision history and a no-dosing teaching record", () => {
    const index=JSON.parse(read("src/content/draft-index.json")).entries as {key:string;type:string;hash:string;issues:unknown[]}[];
    const history=JSON.parse(read("src/content/draft-history.json")).entries as Record<string,{hash:string}[]>;
    for(const [key,file] of records) {
      const d=JSON.parse(read(`content/drafts/medications/${file}`));
      const hash=createHash("sha256").update(JSON.stringify(d)).digest("hex").slice(0,16);
      const e=index.find(v=>v.key===key&&v.type==="medications");
      expect(e?.hash).toBe(hash);
      expect(e?.issues).toEqual([]);
      expect(history[key]?.at(-1)?.hash).toBe(hash);
      const body=JSON.stringify({...d,gaps:undefined,permissions:undefined,high_alert_note:undefined});
      expect(body).not.toMatch(/\b\d+([.,]\d+)?\s*(mcg|µg|mg|g|kg|units?|meq|mmol|ml|dl)\b/i);
      expect(body).not.toMatch(/titrat|y-site|compatib|dilut|reconstitut|infusion rate/i);
    }
  });
});
