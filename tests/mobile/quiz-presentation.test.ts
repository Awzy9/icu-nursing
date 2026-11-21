import { describe, expect, it } from "vitest";
import ecgs from "../../content/working-ecg.json";
import alines from "../../content/working-aline.json";
import waves from "../../content/working-waveforms.json";
import defibs from "../../content/working-defib.json";
import { observationSummary, practiceHeading, type InterpretationKind } from "../../mobile/src/core/quiz-presentation";

describe("diagnoses hidden until exercise is answered", () => {
  it("never presents the answer in the list heading for rhythm, damping, flow or defib", () => {
    const groups = [["ecg", ecgs], ["aline", alines], ["waveforms", waves], ["defib", defibs]] as const;
    for (const [kind, examples] of groups) {
      for (const item of examples) {
        for (const ar of [false, true]) {
          const title = practiceHeading(kind as InterpretationKind, item.key, ar);
          expect(title).toBeTruthy();
          expect(title.toLowerCase()).not.toContain(item.title[ar ? 1 : 0].toLowerCase());
        }
      }
    }
  });
  it("retains the author's non-diagnostic observations for screen readers before checking", () => {
    for (const item of [...ecgs, ...alines, ...waves]) {
      const summary = observationSummary(item.accessibleDescription);
      expect(summary.length).toBe(item.accessibleDescription.length);
      expect(summary.every((x) => x.length > 10)).toBe(true);
      expect(summary.join(" ").toLowerCase()).not.toContain(item.title[0].toLowerCase());
    }
  });
});
