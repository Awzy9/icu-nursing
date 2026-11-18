import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DefibExerciseView } from "@/components/working/defib-exercise";
import { defibExercise } from "@/lib/working/defib";

vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("DefibExerciseView", () => {
  const exercise = defibExercise("DFB-03")!; // asystole, non-shockable

  it("renders the reused ECG trace and requires a choice before feedback", () => {
    render(<DefibExerciseView exercise={exercise} locale="en" />);
    expect(screen.getByRole("img", { name: /mV/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check answer" })).toBeDisabled();
  });

  it("shows correctness with icon and text, never colour alone", () => {
    render(<DefibExerciseView exercise={exercise} locale="en" />);
    const correctOption = exercise.question.options[exercise.question.answer]!;
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[exercise.question.options.indexOf(correctOption)]!);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByText("Correct")).toBeVisible();
    expect(screen.getByText("Correct answer")).toBeVisible();
  });

  it("records the attempt through the shared learning engine", () => {
    render(<DefibExerciseView exercise={exercise} locale="en" />);
    const wrongIndex = (exercise.question.answer + 1) % exercise.question.options.length;
    fireEvent.click(screen.getAllByRole("radio")[wrongIndex]!);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored[exercise.key]).toMatchObject({ correct: false, href: `/defib-rhythm-check/${exercise.key}` });
  });
});
