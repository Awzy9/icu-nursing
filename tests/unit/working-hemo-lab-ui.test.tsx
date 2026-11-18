import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HemoLab } from "@/components/working/hemo-lab";

afterEach(() => cleanup());

describe("HemoLab", () => {
  it("explains the reference values and identifies MAP as an estimate", () => {
    render(<HemoLab locale="en" />);
    expect(screen.getByText("Estimated MAP")).toBeVisible();
    expect(screen.getByText(/Preserved pressure alone/)).toBeVisible();
  });

  it("explains that a teaching preset cannot diagnose sepsis", () => {
    render(<HemoLab locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Distributive example" }));
    expect(screen.getByText(/cannot establish sepsis/)).toBeVisible();
  });

  it("reports an invalid pressure pair instead of calculating resistance", () => {
    render(<HemoLab locale="en" />);
    fireEvent.change(screen.getByLabelText(/Systolic BP/), { target: { value: "50" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Systolic pressure must exceed diastolic pressure");
    expect(screen.getByText("SVR").parentElement).toHaveTextContent("—");
  });

  it("moving a slider changes the cardiac output readout", () => {
    render(<HemoLab locale="en" />);
    const readout = () => screen.getByText("Cardiac output").parentElement!.querySelector("p:nth-of-type(2)")!.textContent;
    const before = readout();
    fireEvent.change(screen.getByLabelText(/Heart rate/), { target: { value: "150" } });
    expect(readout()).not.toBe(before);
  });
});
