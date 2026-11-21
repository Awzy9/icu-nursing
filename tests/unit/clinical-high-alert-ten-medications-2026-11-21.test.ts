import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const entries = [
  ["MD-04", "MD-04-dobutamine.json"],
  ["MD-05", "MD-05-milrinone.json"],
  ["MD-09", "MD-09-fentanyl.json"],
  ["MD-11", "MD-11-ketamine.json"],
  ["MD-16", "MD-16-amiodarone.json"],
  ["MD-17", "MD-17-adenosine.json"],
  ["MD-39", "MD-39-hydromorphone.json"],
  ["MD-44", "MD-44-enoxaparin.json"],
  ["MD-45", "MD-45-alteplase.json"],
  ["MD-46", "MD-46-tranexamic-acid.json"],
] as const;

describe("2026 ten-medication high-alert category review", () => {
  it("uses named ISMP categories without falsely approving medication drafts", () => {
    for(const [id, filename] of entries){
      const m = JSON.parse(read(`content/drafts/medications/${filename}`));
      expect(m.high_alert,id).toBe(true);
      expect(m.high_alert_note).toContain("ISMP");
      expect(m.status).toBe("DRAFT");
      expect(m.clinically_reviewed).toBe(false);
      expect(m.pharmacist_reviewed).toBe(false);
      expect(m.sources.every((x:{id:string})=>x.id!=="S-ISMP-HAM-2024")).toBe(true);
    }
    const report=read("docs/clinical-evidence/AI_REVIEW_HIGH_ALERT_TEN_MEDICATIONS_2026-11-21.md");
    expect(report).toContain("www.ismp.org/system/files/resources/2024-01/");
  });

  it("preserves hashed index/history and prohibits dosing material", () => {
    const index=JSON.parse(read("src/content/draft-index.json")).entries as {
      key:string;type:string;hash:string;issues:unknown[];clinically_reviewed:boolean;
    }[];
    const history=JSON.parse(read("src/content/draft-history.json")).entries as Record<string,{hash:string}[]>;
    for(const [key,file] of entries){
      const m=JSON.parse(read(`content/drafts/medications/${file}`));
      const hash=createHash("sha256").update(JSON.stringify(m)).digest("hex").slice(0,16);
      const e=index.find(x=>x.key===key&&x.type==="medications");
      expect(e?.hash).toBe(hash);
      expect(e?.issues).toEqual([]);
      expect(e?.clinically_reviewed).toBe(false);
      expect(history[key]?.at(-1)?.hash).toBe(hash);
      const body=JSON.stringify({...m,gaps:undefined,permissions:undefined,high_alert_note:undefined});
      expect(body).not.toMatch(/\b\d+([.,]\d+)?\s*(mcg|µg|mg|g|kg|units?|meq|mmol|ml|dl)\b/i);
      expect(body).not.toMatch(/titrat|y-site|compatib|dilut|reconstitut|infusion rate/i);
    }
  });
});
