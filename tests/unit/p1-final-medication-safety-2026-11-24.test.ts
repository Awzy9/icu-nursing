import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { medicationTextViolation } from "@/lib/medications/no-dosing";
const cases = [
  [
    "MD-37-lorazepam",
    "L-LORAZEPAM",
    "safety_alerts",
    "5140798d-8571-41fb-84a4-e182aac3f64c",
    "sleep apnoea"
  ],
  [
    "MD-38-haloperidol",
    "L-HALOPERIDOL",
    "monitoring",
    "b1ad2abd-a9d6-44e3-957b-36a73260f4f5",
    "lithium and haloperidol"
  ],
  [
    "MD-39-hydromorphone",
    "L-HYDROMORPHONE",
    "safety_alerts",
    "67e79859-4efc-4ea7-8211-cadf746bc864",
    "paralytic ileus"
  ],
  [
    "MD-42-atropine",
    "L-ATROPINE",
    "adverse_effects",
    "d5e07279-48ca-4f83-9633-299e65a7f821",
    "hot dry skin"
  ],
  [
    "MD-44-enoxaparin",
    "L-ENOXAPARIN",
    "monitoring",
    "9e2875df-0f0c-46ec-990f-69108f383f58",
    "central back pain"
  ],
  [
    "MD-45-alteplase",
    "L-ALTEPLASE",
    "monitoring",
    "c669f77c-fa48-478b-a14b-80b20a0139c2",
    "ACE inhibitor treatment"
  ],
  [
    "MD-46-tranexamic-acid",
    "L-TXA",
    "safety_alerts",
    "28ccedba-99cd-49f3-a782-798df5258524",
    "active intravascular clotting"
  ],
  [
    "MD-47-levetiracetam",
    "L-LEVETIRACETAM",
    "safety_alerts",
    "1591c690-f4ed-44b7-a9d0-bff1fbb4bfef",
    "Anaphylaxis or angioedema"
  ],
  [
    "MD-48-mannitol",
    "L-MANNITOL",
    "safety_alerts",
    "8ad3145e-00e7-4412-b9a5-06f00f264f30",
    "active intracranial bleeding"
  ],
  [
    "MD-49-pantoprazole",
    "L-PANTOPRAZOLE",
    "safety_alerts",
    "eb3f58d4-0c69-4377-be45-c36099c98d33",
    "rilpivirine-containing treatment"
  ],
  [
    "MD-50-hydrocortisone",
    "L-HYDROCORTISONE",
    "safety_alerts",
    "451d6d04-b7d9-47d9-ba71-43cc5b9b3054",
    "systemic fungal infection"
  ]
] as const;
describe("final medication registered-label safety additions", () => {
  for (const [file, source, section, setid, term] of cases) {
    it(file + " preserves traceable non-dosing safety and draft gates", () => {
      const d = JSON.parse(readFileSync("content/drafts/medications/" + file + ".json", "utf8"));
      const item = d.sections[section].items.find((i:{text:string})=>i.text.includes(term));
      expect(item).toMatchObject({support:"partial",sources:[source]});
      expect(medicationTextViolation(item.text)).toBeNull();
      expect(d.monitoring.at(-1)).toMatchObject({critical:true,support:"partial",sources:[source]});
      expect(medicationTextViolation(d.monitoring.at(-1).text)).toBeNull();
      expect(d.label_currency_check.set_id).toBe(setid);
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
    });
  }
});
