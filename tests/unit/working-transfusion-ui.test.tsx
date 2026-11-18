import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransfusionExerciseView } from "@/components/working/transfusion-exercise";
import { transfusionExercise } from "@/lib/working/transfusion";

vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("TransfusionExerciseView", () => {
  const exercise = transfusionExercise("TRX-01")!;

  it("requires a choice, hides correctness until checked, then shows feedback without relying on colour alone", () => {
    render(<TransfusionExerciseView exercise={exercise} locale="en" />);
    const check = screen.getByRole("button", { name: "Check answer" });
    expect(check).toBeDisabled();
    const correctOption = exercise.question.options[exercise.question.answer]!;
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[exercise.question.options.indexOf(correctOption)]!);
    fireEvent.click(check);
    expect(screen.getByText("Correct")).toBeVisible();
    expect(screen.getByText("Correct answer")).toBeVisible();
    expect(screen.getByRole("link", { name: /Read the related lesson/ })).toHaveAttribute("href", "/working/D08-T03");
  });

  it("records the attempt through the shared learning engine", () => {
    render(<TransfusionExerciseView exercise={exercise} locale="en" />);
    const wrongIndex = (exercise.question.answer + 1) % exercise.question.options.length;
    fireEvent.click(screen.getAllByRole("radio")[wrongIndex]!);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored[exercise.key]).toMatchObject({ correct: false, href: `/transfusion-reactions/${exercise.key}` });
  });
});
