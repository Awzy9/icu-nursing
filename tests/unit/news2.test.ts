import { describe, expect, it } from "vitest";
import {
  bpScore, consciousnessScore, hasSingleRedScore, news2Band, news2Total, oxygenScore,
  pulseScore, respirationScore, spo2Scale1Score, spo2Scale2Score, temperatureScore,
  type News2Input,
} from "@/lib/working/news2";

const base: News2Input = {
  respiratoryRate: 16, spo2: 98, scale: "1", onOxygen: false,
  systolicBp: 120, pulse: 70, consciousness: "alert", temperature: 37.0,
};

describe("NEWS2 per-parameter scoring (RCP Chart 1 boundaries)", () => {
  it("scores respiration rate", () => {
    expect(respirationScore(8)).toBe(3);
    expect(respirationScore(9)).toBe(1);
    expect(respirationScore(11)).toBe(1);
    expect(respirationScore(12)).toBe(0);
    expect(respirationScore(20)).toBe(0);
    expect(respirationScore(21)).toBe(2);
    expect(respirationScore(24)).toBe(2);
    expect(respirationScore(25)).toBe(3);
  });

  it("scores SpO2 Scale 1", () => {
    expect(spo2Scale1Score(91)).toBe(3);
    expect(spo2Scale1Score(92)).toBe(2);
    expect(spo2Scale1Score(93)).toBe(2);
    expect(spo2Scale1Score(94)).toBe(1);
    expect(spo2Scale1Score(95)).toBe(1);
    expect(spo2Scale1Score(96)).toBe(0);
  });

  it("scores SpO2 Scale 2, which depends on air vs oxygen above the 88-92 target range", () => {
    expect(spo2Scale2Score(83, false)).toBe(3);
    expect(spo2Scale2Score(85, false)).toBe(2);
    expect(spo2Scale2Score(87, false)).toBe(1);
    expect(spo2Scale2Score(88, false)).toBe(0);
    expect(spo2Scale2Score(92, false)).toBe(0);
    expect(spo2Scale2Score(93, false)).toBe(0); // on air: >=93 scores 0
    expect(spo2Scale2Score(93, true)).toBe(1); // on oxygen: 93-94 scores 1
    expect(spo2Scale2Score(94, true)).toBe(1);
    expect(spo2Scale2Score(95, true)).toBe(2);
    expect(spo2Scale2Score(96, true)).toBe(2);
    expect(spo2Scale2Score(97, true)).toBe(3);
  });

  it("scores the air-or-oxygen line as a flat +2 for any supplemental oxygen", () => {
    expect(oxygenScore(false)).toBe(0);
    expect(oxygenScore(true)).toBe(2);
  });

  it("scores systolic blood pressure", () => {
    expect(bpScore(90)).toBe(3);
    expect(bpScore(100)).toBe(2);
    expect(bpScore(110)).toBe(1);
    expect(bpScore(111)).toBe(0);
    expect(bpScore(219)).toBe(0);
    expect(bpScore(220)).toBe(3);
  });

  it("scores pulse rate", () => {
    expect(pulseScore(40)).toBe(3);
    expect(pulseScore(50)).toBe(1);
    expect(pulseScore(90)).toBe(0);
    expect(pulseScore(110)).toBe(1);
    expect(pulseScore(130)).toBe(2);
    expect(pulseScore(131)).toBe(3);
  });

  it("scores consciousness as 0 for alert and 3 for any new ACVPU abnormality", () => {
    expect(consciousnessScore("alert")).toBe(0);
    expect(consciousnessScore("cvpu")).toBe(3);
  });

  it("scores temperature, whose high end tops out at 2 (never 3) per the chart", () => {
    expect(temperatureScore(35.0)).toBe(3);
    expect(temperatureScore(36.0)).toBe(1);
    expect(temperatureScore(38.0)).toBe(0);
    expect(temperatureScore(39.0)).toBe(1);
    expect(temperatureScore(39.1)).toBe(2);
    expect(temperatureScore(41.0)).toBe(2);
  });
});

describe("NEWS2 aggregate score and response bands (RCP Chart 2)", () => {
  it("sums a fully normal patient to 0, low risk", () => {
    expect(news2Total(base)).toBe(0);
    expect(hasSingleRedScore(base)).toBe(false);
    expect(news2Band(news2Total(base), false)).toBe("low");
  });

  it("adds the +2 oxygen weighting on top of the parameter scores", () => {
    const input: News2Input = { ...base, onOxygen: true, spo2: 95 }; // spo2 scale1: 95->1, +2 oxygen = 3
    expect(news2Total(input)).toBe(3);
  });

  it("classifies a single parameter at its extreme as a red score (low-medium), even with a low aggregate", () => {
    const input: News2Input = { ...base, pulse: 35 }; // pulse 35 -> 3, rest 0 -> total 3
    expect(news2Total(input)).toBe(3);
    expect(hasSingleRedScore(input)).toBe(true);
    expect(news2Band(news2Total(input), true)).toBe("low-medium");
  });

  it("classifies an aggregate of 5-6 as medium, the key threshold for urgent response", () => {
    const input: News2Input = { ...base, respiratoryRate: 23, pulse: 115 }; // 2 + 2 = 4... needs 5-6
    const total = news2Total({ ...base, respiratoryRate: 23, systolicBp: 100 }); // 2 + 2 = 4
    expect(total).toBe(4);
    const medium: News2Input = { ...base, respiratoryRate: 23, systolicBp: 100, temperature: 38.5 }; // 2+2+1=5
    expect(news2Total(medium)).toBe(5);
    expect(news2Band(news2Total(medium), hasSingleRedScore(medium))).toBe("medium");
    void input;
  });

  it("classifies an aggregate of 7 or more as high, the emergency threshold", () => {
    const input: News2Input = { ...base, respiratoryRate: 26, spo2: 90, systolicBp: 85, pulse: 135, consciousness: "cvpu" };
    const total = news2Total(input);
    expect(total).toBeGreaterThanOrEqual(7);
    expect(news2Band(total, hasSingleRedScore(input))).toBe("high");
  });

  it("gives aggregate priority over a single red score once the aggregate reaches 5", () => {
    // A single red (pulse 35 = 3) plus enough else to reach aggregate 5 should band as medium, not low-medium.
    const input: News2Input = { ...base, pulse: 35, respiratoryRate: 22 }; // 3 + 2 = 5
    expect(news2Total(input)).toBe(5);
    expect(news2Band(news2Total(input), hasSingleRedScore(input))).toBe("medium");
  });
});
