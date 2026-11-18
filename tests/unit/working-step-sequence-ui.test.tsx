import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StepSequenceExercise } from "@/components/working/step-sequence-exercise";

const steps = ["First step", "Second step", "Third step"];

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("StepSequenceExercise", () => {
  it("renders steps in the given shuffled order and lets the learner reorder them before checking", () => {
    render(<StepSequenceExercise moduleKey="SK-02" title="Central line care" steps={steps} initialOrder={[2, 0, 1]} locale="en" />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Third step");
    expect(items[1]).toHaveTextContent("First step");
    expect(items[2]).toHaveTextContent("Second step");

    // Move "Third step" (position 0) down once -> order becomes [0, 2, 1]
    fireEvent.click(screen.getAllByRole("button", { name: "Move down" })[0]!);
    const afterMove = screen.getAllByRole("listitem");
    expect(afterMove[0]).toHaveTextContent("First step");
    expect(afterMove[1]).toHaveTextContent("Third step");
  });

  it("shows full-credit feedback for a fully correct order and records the attempt", () => {
    render(<StepSequenceExercise moduleKey="SK-02" title="Central line care" steps={steps} initialOrder={[0, 1, 2]} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Check order" }));
    expect(screen.getByText("Fully correct order")).toBeVisible();
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored["SK-02-sequence"]).toMatchObject({ correct: true });
  });

  it("shows a partial score for an incorrect order and records the attempt as incorrect", () => {
    render(<StepSequenceExercise moduleKey="SK-02" title="Central line care" steps={steps} initialOrder={[1, 0, 2]} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Check order" }));
    expect(screen.getByText("Steps in the correct position: 1 / 3")).toBeVisible();
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored["SK-02-sequence"]).toMatchObject({ correct: false });
  });

  it("disables reorder and check controls once checked", () => {
    render(<StepSequenceExercise moduleKey="SK-02" title="Central line care" steps={steps} initialOrder={[0, 1, 2]} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Check order" }));
    expect(screen.getByRole("button", { name: "Check order" })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Move down" })[0]).toBeDisabled();
  });
});
