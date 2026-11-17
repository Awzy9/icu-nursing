import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WaveformExerciseView } from "@/components/working/waveform-exercise";
import { waveformExercise } from "@/lib/working/waveform";

vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("WaveformExerciseView", () => {
  const exercise = waveformExercise("WV-02")!;

  it("requires a choice, hides correctness until checked, then shows feedback without relying on colour alone", () => {
    render(<WaveformExerciseView exercise={exercise} locale="en" />);
    expect(screen.getByText(exercise.question.prompt)).toBeVisible();
    const check = screen.getByRole("button", { name: "Check answer" });
    expect(check).toBeDisabled();
    expect(screen.queryByText("Correct answer")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Auto-PEEP/ }));
    expect(screen.queryByText("Correct answer")).not.toBeInTheDocument();
    fireEvent.click(check);
    expect(screen.getByText("Correct")).toBeVisible();
    expect(screen.getByText("Correct answer")).toBeVisible();
    expect(screen.getByRole("link", { name: /Read the related lesson/ })).toHaveAttribute("href", exercise.lessonHref);
  });

  it("gives the accessible text description as real, readable content - not just an image alt", () => {
    render(<WaveformExerciseView exercise={exercise} locale="en" />);
    for (const line of exercise.accessibleDescription) expect(screen.getByText(line)).toBeVisible();
  });

  it("records the attempt through the shared learning engine, like every other quiz", () => {
    render(<WaveformExerciseView exercise={exercise} locale="en" />);
    fireEvent.click(screen.getByRole("radio", { name: /A normal breath/ })); // the wrong option for WV-02
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored[exercise.key]).toMatchObject({ correct: false, href: "/waveforms/WV-02" });
  });
});
