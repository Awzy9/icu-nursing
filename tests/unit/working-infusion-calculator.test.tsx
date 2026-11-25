import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InfusionCalculator } from "@/components/working/infusion-calculator";

afterEach(cleanup);

function enter(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
}

describe("infusion calculator", () => {
  it("preserves volumetric rate calculations with duration in minutes", () => {
    render(<InfusionCalculator locale="en" />);
    enter("Volume (mL)", "50");
    enter("Duration unit", "minutes");
    enter("Duration", "30");
    expect(screen.getByText("100 mL/h")).toBeTruthy();
  });

  it("rejects ambiguous or nondecimal entry instead of silently converting it", () => {
    render(<InfusionCalculator locale="en" />);
    enter("Duration", "2");
    for (const value of ["1,000", "1e3", "0x10", "Infinity"]) {
      enter("Volume (mL)", value);
      expect(screen.getByText("Enter two positive values to see the result.")).toBeTruthy();
    }
    enter("Volume (mL)", "1,5");
    expect(screen.getByText("0.75 mL/h")).toBeTruthy();
  });

  it("accepts Arabic decimal input without accepting grouping", () => {
    render(<InfusionCalculator locale="en" />);
    enter("Volume (mL)", "١٥٠");
    enter("Duration", "٢");
    expect(screen.getByText("75 mL/h")).toBeTruthy();
    enter("Volume (mL)", "١٬٠٠٠");
    expect(screen.queryByText("75 mL/h")).toBeNull();
    expect(screen.getByText("Enter two positive values to see the result.")).toBeTruthy();
  });

  it("rejects ambiguous dose and concentration inputs", () => {
    render(<InfusionCalculator locale="en" />);
    enter("Dose rate", "6");
    enter("Solution concentration", "1,000");
    expect(screen.queryByText("6 mL/h")).toBeNull();
    enter("Solution concentration", "2");
    expect(screen.getByText("3 mL/h")).toBeTruthy();
    enter("Dose rate", "1e3");
    expect(screen.queryByText("3 mL/h")).toBeNull();
  });

  it("calculates a fixed dose rate from concentration", () => {
    render(<InfusionCalculator locale="en" />);
    enter("Dose rate", "6");
    enter("Solution concentration", "2");
    expect(screen.getByText("3 mL/h")).toBeTruthy();
  });

  it("marks a repeating decimal as approximate", () => {
    render(<InfusionCalculator locale="en" />);
    enter("Dose rate", "2");
    enter("Solution concentration", "3");
    expect(screen.getByText("2 mg/h ÷ 3 mg/mL ≈ 0.666667 mL/h")).toBeTruthy();
  });

  it("converts weight, mass and time units and clears results when the units change", () => {
    render(<InfusionCalculator locale="en" />);
    enter("Dose basis", "weight");
    enter("Dose unit", "mcg/min");
    enter("Concentration unit", "mcg/mL");
    enter("Dose rate", "0.2");
    enter("Example weight (kg)", "50");
    enter("Solution concentration", "100");
    expect(screen.getByText("6 mL/h")).toBeTruthy();
    enter("Example weight (kg)", "0");
    expect(screen.queryByText("6 mL/h")).toBeNull();
    enter("Example weight (kg)", "50");
    enter("Concentration unit", "mg/mL");
    expect(screen.queryByText("6 mL/h")).toBeNull();
  });
});
