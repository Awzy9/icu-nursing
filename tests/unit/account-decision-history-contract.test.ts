import { describe, expect, it } from "vitest";
import { scenarioDecisionHistorySchema, sessionRowSchema } from "@icu/schemas/working-progress";
const row = { module_key:"SC-01",kind:"scenario",version:"sc2-example",position:3,score:2,finished:false,updated_at:"2026-11-24T00:00:00Z" };
describe("Account decision history wire contract", () => {
  it("keeps missing, null and empty history distinct", () => {
    expect(sessionRowSchema.parse(row).decisions).toBeUndefined();
    expect(sessionRowSchema.parse({...row,decisions:null}).decisions).toBeNull();
    expect(sessionRowSchema.parse({...row,decisions:[]}).decisions).toEqual([]);
  });
  it("preserves bounded ordered history", () => {
    const decisions=[{position:1,choice:0},{position:2,choice:2}];
    expect(sessionRowSchema.parse({...row,decisions}).decisions).toEqual(decisions);
  });
  it("rejects invalid shape without discarding the aggregate progress record", () => {
    for(const decisions of [[{position:0,choice:0}],[{position:1000,choice:1}],[{position:1,choice:4}],[{position:1,choice:0,extra:true}],[{position:2,choice:0},{position:1,choice:0}],[{position:1,choice:1},{position:1,choice:2}],Array.from({length:101},(_,i)=>({position:i+1,choice:0}))]){
      expect(scenarioDecisionHistorySchema.safeParse(decisions).success).toBe(false);
      expect(sessionRowSchema.parse({...row,decisions}).decisions).toBeUndefined();
      expect(sessionRowSchema.parse({...row,decisions}).score).toBe(2);
    }
  });
});
