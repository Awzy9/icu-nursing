import { describe, expect, it } from "vitest";
import { hasSingleRedScore, news2Band, news2CaseBand, news2CaseSchema, news2CaseTotal, news2Total, type News2Case } from "../../mobile/src/core/news2";
import { allNews2Cases, news2CaseBand as news2CaseBandWeb, news2CaseTotal as news2CaseTotalWeb } from "@/lib/working/news2-case";

describe("news2 scoring (mirrors src/lib/working/news2.ts exactly)", () => {
  it("scores a fully normal set of vitals as 0", () => {
    expect(news2Total({ respiratoryRate: 16, spo2: 98, scale: "1", onOxygen: false, systolicBp: 122, pulse: 72, consciousness: "alert", temperature: 36.8 })).toBe(0);
  });
  it("gives a single red score (any parameter at 3) a low-medium band even with a low total", () => {
    expect(hasSingleRedScore({ respiratoryRate: 6, spo2: 98, scale: "1", onOxygen: false, systolicBp: 122, pulse: 72, consciousness: "alert", temperature: 36.8 })).toBe(true);
    expect(news2Band(3, true)).toBe("low-medium");
  });
  it("bands total >=7 as high and >=5 as medium, independent of single-red", () => {
    expect(news2Band(7, false)).toBe("high");
    expect(news2Band(5, false)).toBe("medium");
    expect(news2Band(0, false)).toBe("low");
  });
});

describe("news2CaseSchema and the real dataset", () => {
  const realCases = allNews2Cases();

  it("ships at least one real case to validate against", () => {
    expect(realCases.length).toBeGreaterThan(0);
  });

  it("validates every real case against the mobile schema (same shape the content API serves)", () => {
    for (const c of realCases) expect(news2CaseSchema.safeParse(c).success, `case ${c.key}`).toBe(true);
  });

  it("agrees with the website's own news2CaseTotal/news2CaseBand for every real case - no drift between the two mirrors", () => {
    for (const c of realCases) {
      const mobileCase = c as News2Case;
      expect(news2CaseTotal(mobileCase)).toBe(news2CaseTotalWeb(c));
      expect(news2CaseBand(mobileCase)).toBe(news2CaseBandWeb(c));
    }
  });
});
