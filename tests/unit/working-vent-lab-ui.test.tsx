import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VentLab } from "@/components/working/vent-lab";

afterEach(() => cleanup());

describe("VentLab", () => {
  it("shows no alarm banner for the default normal settings", () => {
    render(<VentLab locale="en" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the high-pressure alarm when the stiff-lungs scenario is selected", () => {
    render(<VentLab locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Stiff lungs (low compliance)" }));
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByText(/High-pressure alarm/)).toBeVisible();
  });

  it("shows the low-pressure alarm when the circuit-disconnect scenario is selected", () => {
    render(<VentLab locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Circuit disconnect" }));
    expect(screen.getByText(/Low-pressure alarm/)).toBeVisible();
  });

  it("moving a slider updates the pressure readout (higher tidal volume raises peak pressure)", () => {
    render(<VentLab locale="en" />);
    const peakValue = () => screen.getByText("Peak").parentElement!.querySelector("p:nth-of-type(2)")!.textContent;
    const before = peakValue();
    const slider = screen.getByLabelText(/Tidal volume/) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "600" } });
    const after = peakValue();
    expect(after).not.toBe(before);
  });
});
