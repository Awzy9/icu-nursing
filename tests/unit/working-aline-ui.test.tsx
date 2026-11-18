import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AlineExerciseView } from "@/components/working/aline-exercise";
import { alineExercise } from "@/lib/working/aline";

vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("AlineExerciseView", () => {
  const exercise = alineExercise("ALN-02")!; // overdamped

  it("requires a choice, hides correctness until checked, then shows feedback without relying on colour alone", () => {
    render(<AlineExerciseView exercise={exercise} locale="en" />);
    const check = screen.getByRole("button", { name: "Check answer" });
    expect(check).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /Overdamping/ }));
    fireEvent.click(check);
    expect(screen.getByText("Correct")).toBeVisible();
    expect(screen.getByText("Correct answer")).toBeVisible();
    expect(screen.getByRole("link", { name: /Read the related lesson/ })).toHaveAttribute("href", exercise.lessonHref);
  });

  it("gives the accessible text description as real, readable content", () => {
    render(<AlineExerciseView exercise={exercise} locale="en" />);
    for (const line of exercise.accessibleDescription) expect(screen.getByText(line)).toBeVisible();
  });

  it("records the attempt through the shared learning engine", () => {
    render(<AlineExerciseView exercise={exercise} locale="en" />);
    fireEvent.click(screen.getByRole("radio", { name: /Optimal damping/ })); // wrong for ALN-02
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored[exercise.key]).toMatchObject({ correct: false, href: `/aline/${exercise.key}` });
  });
});
