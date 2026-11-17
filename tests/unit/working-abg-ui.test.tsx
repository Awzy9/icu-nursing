import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AbgExerciseView } from "@/components/working/abg-exercise";
import { abgCase } from "@/lib/working/abg-case";

vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("AbgExerciseView", () => {
  const exercise = abgCase("ABG-02")!;

  it("shows the gas panel values and requires a choice before feedback appears", () => {
    render(<AbgExerciseView exercise={exercise} locale="en" />);
    expect(screen.getByText("7.1")).toBeVisible();
    const check = screen.getByRole("button", { name: "Check answer" });
    expect(check).toBeDisabled();
    expect(screen.queryByText("Correct answer")).not.toBeInTheDocument();
  });

  it("shows correctness with icon and text, never colour alone, after checking", () => {
    render(<AbgExerciseView exercise={exercise} locale="en" />);
    const correctOption = exercise.question.options[exercise.question.answer]!;
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[exercise.question.options.indexOf(correctOption)]!);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByText("Correct")).toBeVisible();
    expect(screen.getByText("Correct answer")).toBeVisible();
    expect(screen.getByRole("link", { name: /Read the related lesson/ })).toHaveAttribute("href", exercise.lessonHref);
  });

  it("records the attempt through the shared learning engine", () => {
    render(<AbgExerciseView exercise={exercise} locale="en" />);
    const wrongIndex = (exercise.question.answer + 1) % exercise.question.options.length;
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[wrongIndex]!);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored[exercise.key]).toMatchObject({ correct: false, href: `/abg/${exercise.key}` });
  });
});
