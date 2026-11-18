import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InfusionExerciseView } from "@/components/working/infusion-exercise";
import { infusionCase } from "@/lib/working/infusion-case";

vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("InfusionExerciseView", () => {
  const exercise = infusionCase("INF-01")!;

  it("requires a choice, hides correctness until checked, then shows feedback without relying on colour alone", () => {
    render(<InfusionExerciseView exercise={exercise} locale="en" />);
    const check = screen.getByRole("button", { name: "Check answer" });
    expect(check).toBeDisabled();
    expect(screen.queryByText("Correct", { selector: "h3" })).not.toBeInTheDocument();
    const correctLabel = `${exercise.options[exercise.answerIndex]} mL/hr`;
    fireEvent.click(screen.getByText(correctLabel).closest("label")!.querySelector("input")!);
    fireEvent.click(check);
    expect(screen.getByRole("heading", { name: "Correct" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Read about this medication/ })).toHaveAttribute("href", `/working/${exercise.drugRef}`);
  });

  it("always shows the safety note that this is not a bedside dosing tool", () => {
    render(<InfusionExerciseView exercise={exercise} locale="en" />);
    expect(screen.getByText(/not a tool for calculating a real patient's actual infusion rate/)).toBeVisible();
  });

  it("records the attempt through the shared learning engine", () => {
    render(<InfusionExerciseView exercise={exercise} locale="en" />);
    const wrongIndex = (exercise.answerIndex + 1) % exercise.options.length;
    fireEvent.click(screen.getAllByRole("radio")[wrongIndex]!);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored[exercise.key]).toMatchObject({ correct: false, href: `/infusion-practice/${exercise.key}` });
  });
});
