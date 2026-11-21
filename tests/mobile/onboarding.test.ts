import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { emptyProgress, type Progress } from "../../mobile/src/core/progress";
import { hasExistingLearningActivity, onboardingSteps, shouldAutoStartOnboarding, ONBOARDING_STORAGE_KEY } from "../../mobile/src/core/onboarding";

const source = (file: string) => readFileSync(path.resolve(__dirname, "../../mobile", file), "utf8");

describe("bilingual new-user onboarding", () => {
  it("has six short, accessible sections describing actual in-app features", () => {
    expect(onboardingSteps.map((step) => step.id)).toEqual(["welcome", "learn", "practice", "tools", "visuals", "get-started"]);
    for (const step of onboardingSteps) {
      for (const lang of [0, 1] as const) {
        expect(step.title[lang].length).toBeGreaterThan(5);
        expect(step.description[lang].length).toBeGreaterThan(30);
        expect(step.points.every((point) => point[lang].trim().length > 5)).toBe(true);
      }
      expect(step.points).toHaveLength(3);
    }
  });

  it("only automatically launches after local state is ready, for a fresh unused profile", () => {
    const fresh = emptyProgress();
    expect(shouldAutoStartOnboarding(false, false, fresh)).toBe(false);
    expect(shouldAutoStartOnboarding(true, true, fresh)).toBe(false);
    expect(shouldAutoStartOnboarding(true, false, fresh)).toBe(true);
    expect(hasExistingLearningActivity(fresh)).toBe(false);
    const variants: Progress[] = [
      { ...fresh, viewed: ["EQ-01"] },
      { ...fresh, bookmarks: ["topics:D01-T01"] },
      { ...fresh, completed: ["EQ-01"] },
      { ...fresh, practice: [{ total: 1, right: 0, at: "2026-11-21" }] },
      { ...fresh, attempts: { "TEST-001": { correct: false, at: "2026-11-21", box: 1 } } },
      { ...fresh, cases: { "SC-01": { at: "2026-11-21", scoreTenths: 10 } } },
      { ...fresh, ticks: { "SK-01": [0] } },
    ];
    for (const previous of variants) {
      expect(hasExistingLearningActivity(previous)).toBe(true);
      expect(shouldAutoStartOnboarding(true, false, previous)).toBe(false);
    }
  });

  it("does not conflate onboarding completion with learning progress or account sync", () => {
    expect(ONBOARDING_STORAGE_KEY).not.toMatch(/progress|session|bookmark/i);
    const appState = source("src/state/app.tsx");
    expect(appState).toContain("ONBOARDING_STORAGE_KEY");
    expect(appState).toContain('AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "dismissed")');
    expect(appState).toContain("setOnboardingSeen(true)");
    const tutorial = source("app/onboarding.tsx");
    expect(tutorial).toContain("finishOnboarding()");
    expect(tutorial).not.toContain("setComplete(");
    expect(tutorial).not.toContain("recordAnswer(");
  });

  it("is skippable, replayable, accessible and links to live destination screens", () => {
    const tour = source("app/onboarding.tsx");
    const home = source("app/(tabs)/home.tsx");
    const root = source("app/(tabs)/index.tsx");
    const tabs = source("app/(tabs)/_layout.tsx");
    const account = source("app/(tabs)/account.tsx");
    const layout = source("app/_layout.tsx");
    expect(tour).toContain("Skip tutorial");
    expect(tour).toContain('accessibilityRole="button"');
    expect(tour).toContain("Start a Learning Path");
    expect(tour).toContain("Explore Visual Library");
    expect(tour).toContain("Try Practice");
    for (const p of ["paths/index.tsx", "(tabs)/visuals.tsx", "(tabs)/practice.tsx"]) {
      expect(() => source(`app/${p}`)).not.toThrow();
    }
    expect(home).toContain('router.replace("/onboarding")');
    expect(root).toContain('<Redirect href="/(tabs)/home" />');
    expect(tabs).toContain('<Tabs.Screen name="home"');
    expect(tabs).toContain('<Tabs.Screen name="index" options={{ href: null }}');
    expect(tour.match(/navigate\("\/\(tabs\)\/home"\)/g)).toHaveLength(2);
    expect(tour).not.toContain('navigate("/(tabs)/index")');
    expect(tour).toContain('<Screen banner={false} safeAreaTop>');
    expect(home).toContain('href: "/onboarding"');
    expect(account).toContain('href="/onboarding"');
    expect(layout).toContain('name="onboarding"');
  });
});
