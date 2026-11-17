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
    expect(screen.getByText(/Low-pressure alarm.*assess the patient first/)).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(/assess the patient first/i);
  });

  it("explains impossible timings and restores readouts when corrected", () => {
    render(<VentLab locale="en" />);
    fireEvent.change(screen.getByLabelText(/Respiratory rate/), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText(/Inspiratory time/), { target: { value: "2" } });
    expect(screen.getByRole("alert")).toHaveTextContent("no time for exhalation");
    expect(screen.queryByText("Peak")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Inspiratory time/), { target: { value: "1.9" } });
    expect(screen.getByText(/Expiratory time: 0.10 s/)).toBeVisible();
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
