import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CrrtExplorer } from "@/components/working/crrt-explorer";
import { CrrtAlarmExerciseView } from "@/components/working/crrt-alarm-exercise";
import { allCrrtComponents, crrtAlarm } from "@/lib/working/crrt";

vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("CrrtExplorer", () => {
  const components = allCrrtComponents();

  it("shows the first component's description by default, and switches on click", () => {
    render(<CrrtExplorer components={components} locale="en" />);
    expect(screen.getByText(components[0]!.description[0])).toBeVisible();
    const other = components.find((c) => c.key !== components[0]!.key)!;
    fireEvent.click(screen.getByRole("button", { name: other.label[0] }));
    expect(screen.getByText(other.description[0])).toBeVisible();
  });
});

describe("CrrtAlarmExerciseView", () => {
  const exercise = crrtAlarm("CRRT-A3")!; // air-in-line - never bypass the detector

  it("requires a choice before feedback, then shows correctness with icon and text", () => {
    render(<CrrtAlarmExerciseView exercise={exercise} locale="en" />);
    const check = screen.getByRole("button", { name: "Check answer" });
    expect(check).toBeDisabled();
    const correctOption = exercise.question.options[exercise.question.answer]!;
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[exercise.question.options.indexOf(correctOption)]!);
    fireEvent.click(check);
    expect(screen.getByText("Correct")).toBeVisible();
    expect(screen.getByText("Correct answer")).toBeVisible();
  });

  it("records the attempt through the shared learning engine", () => {
    render(<CrrtAlarmExerciseView exercise={exercise} locale="en" />);
    const wrongIndex = (exercise.question.answer + 1) % exercise.question.options.length;
    fireEvent.click(screen.getAllByRole("radio")[wrongIndex]!);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored[exercise.key]).toMatchObject({ correct: false, href: `/crrt/${exercise.key}` });
  });
});
