import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GcsTrainer } from "@/components/working/gcs-trainer";
import { gcsCase } from "@/lib/working/gcs-case";

vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

function selectOption(groupLegend: string, label: string) {
  const legend = screen.getByText(groupLegend);
  const fieldset = legend.closest("fieldset")!;
  fireEvent.click(within(fieldset).getByRole("button", { name: new RegExp(label) }));
}

describe("GcsTrainer - free exploration mode (no case)", () => {
  it("shows a prompt until all three categories are selected, then the live total and severity", () => {
    render(<GcsTrainer locale="en" />);
    expect(screen.getByText(/Select one response/)).toBeVisible();
    selectOption("Eye opening", "Spontaneous");
    selectOption("Verbal response", "Oriented");
    selectOption("Motor response", "Obeys commands");
    expect(screen.getByText("15")).toBeVisible();
    expect(screen.getByText(/Mild/)).toBeVisible();
  });

  it("has no Check button in free-exploration mode (no case to check against)", () => {
    render(<GcsTrainer locale="en" />);
    expect(screen.queryByRole("button", { name: "Check scoring" })).not.toBeInTheDocument();
  });
});

describe("GcsTrainer - case practice mode", () => {
  const exampleCase = gcsCase("GCS-02")!; // E2 V2 M4 = 8, severe

  it("shows the vignette and requires all three selections before Check is enabled", () => {
    render(<GcsTrainer locale="en" gcsCase={exampleCase} />);
    expect(screen.getByText(exampleCase.vignette)).toBeVisible();
    expect(screen.getByRole("button", { name: "Check scoring" })).toBeDisabled();
  });

  it("confirms correct scoring with positive feedback and records the attempt", () => {
    render(<GcsTrainer locale="en" gcsCase={exampleCase} />);
    selectOption("Eye opening", "To pain");
    selectOption("Verbal response", "Incomprehensible sounds");
    selectOption("Motor response", "Withdraws from pain");
    fireEvent.click(screen.getByRole("button", { name: "Check scoring" }));
    expect(screen.getByText("Correct scoring")).toBeVisible();
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored[exampleCase.key]).toMatchObject({ correct: true });
  });

  it("flags incorrect scoring and still records the attempt", () => {
    render(<GcsTrainer locale="en" gcsCase={exampleCase} />);
    selectOption("Eye opening", "Spontaneous"); // wrong - correct is "To pain"
    selectOption("Verbal response", "Incomprehensible sounds");
    selectOption("Motor response", "Withdraws from pain");
    fireEvent.click(screen.getByRole("button", { name: "Check scoring" }));
    expect(screen.getByText("Let's review this scoring")).toBeVisible();
    const stored = JSON.parse(localStorage.getItem("icu-nursing-learning-v1") ?? "{}");
    expect(stored[exampleCase.key]).toMatchObject({ correct: false });
  });
});
