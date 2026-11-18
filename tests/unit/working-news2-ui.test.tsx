import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { News2ExerciseView } from "@/components/working/news2-exercise";
import { news2Case } from "@/lib/working/news2-case";

vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("News2ExerciseView", () => {
  const exercise = news2Case("NEWS2-02")!;

  it("requires a choice before feedback is shown", () => {
    render(<News2ExerciseView exercise={exercise} locale="en" />);
    expect(screen.getByRole("button", { name: "Check answer" })).toBeDisabled();
  });

  it("shows correctness with icon and text, never colour alone", () => {
    render(<News2ExerciseView exercise={exercise} locale="en" />);
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[exercise.answer]!);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByText("Correct")).toBeVisible();
    expect(screen.getByText("Correct answer")).toBeVisible();
  });

  it("records the attempt through the shared learning engine", () => {
    render(<News2ExerciseView exercise={exercise} locale="en" />);
    const wrongIndex = (exercise.answer + 1) % exercise.options.length;
    fireEvent.click(screen.getAllByRole("radio")[wrongIndex]!);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored[exercise.key]).toMatchObject({ correct: false, href: `/news2/${exercise.key}` });
  });

  it("shows which SpO2 scale is in use", () => {
    render(<News2ExerciseView exercise={exercise} locale="en" />);
    expect(screen.getByText(/Scored on SpO2 Scale 1/)).toBeInTheDocument();
    cleanup();
    const scale2 = news2Case("NEWS2-05")!;
    render(<News2ExerciseView exercise={scale2} locale="en" />);
    expect(screen.getByText(/Scored on SpO2 Scale 2/)).toBeInTheDocument();
  });
});
