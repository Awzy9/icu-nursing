import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
process.env.CONTENT_EDITION = "working";
import { LearningProvider } from "@/components/working/progress";
import { PathsList, PathDetail } from "@/components/working/paths";
import { findPath, resolveAllPaths } from "@/lib/working/paths";

vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("PathsList", () => {
  it("lists every guided path with a start/continue action", () => {
    const paths = resolveAllPaths();
    render(<LearningProvider accountId={null}><PathsList paths={paths} locale="en" /></LearningProvider>);
    for (const p of paths) expect(screen.getAllByText(p.title[0]).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Start path").length).toBeGreaterThan(0);
  });
});

describe("PathDetail", () => {
  const path = findPath("new-to-icu")!;

  it("shows every step as not yet done for a signed-out guest with no local activity", () => {
    render(<LearningProvider accountId={null}><PathDetail path={path} locale="en" /></LearningProvider>);
    expect(screen.getByText(`0/${path.steps.length} · 0%`)).toBeVisible();
    expect(screen.getByRole("link", { name: new RegExp(`^Start: ${path.steps[0]!.title}`) })).toBeVisible();
  });

  it("reflects real recorded activity, not a view, as step completion", () => {
    const lessonStep = path.steps.find((s) => s.type === "topics")!;
    render(
      <LearningProvider accountId="account-a" initial={{ attempts: [], bookmarks: [], lessons: [{ key: lessonStep.key, title: lessonStep.title, type: "topics", href: lessonStep.href, completed: true, at: 1 }], sessions: [] }}>
        <PathDetail path={path} locale="en" />
      </LearningProvider>,
    );
    expect(screen.getByText(`1/${path.steps.length} · ${Math.round(100 / path.steps.length)}%`)).toBeVisible();
  });

  it("shows a completion summary only once every step is done, and never overstates it as certification", () => {
    const lessons = path.steps.filter((s) => s.type !== "questions").map((s) => ({ key: s.key, title: s.title, type: s.type, href: s.href, completed: true, at: 1 }));
    const attempts = path.steps.filter((s) => s.type === "questions").flatMap((s) => Array.from({ length: s.questionCount! }, (_, i) => ({ id: `${s.key}-${i}`, title: s.title, href: s.href, correct: true, at: 1 })));
    render(<LearningProvider accountId="account-a" initial={{ attempts, bookmarks: [], lessons, sessions: [] }}><PathDetail path={path} locale="en" /></LearningProvider>);
    expect(screen.getByText(`${path.steps.length}/${path.steps.length} · 100%`)).toBeVisible();
    expect(screen.getByText(/not a certification of clinical competence/)).toBeVisible();
  });
});
