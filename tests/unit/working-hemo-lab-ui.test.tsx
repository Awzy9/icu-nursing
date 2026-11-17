import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HemoLab } from "@/components/working/hemo-lab";

afterEach(() => cleanup());

describe("HemoLab", () => {
  it("shows the normal pattern label for the default settings", () => {
    render(<HemoLab locale="en" />);
    expect(screen.getByText("Normal", { selector: "div" })).toBeVisible();
  });

  it("shows the distributive pattern label when the septic-shock scenario is selected", () => {
    render(<HemoLab locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Septic (distributive) shock" }));
    expect(screen.getByText(/Distributive pattern/)).toBeVisible();
  });

  it("explicitly discloses the cardiogenic/obstructive ambiguity rather than forcing one answer", () => {
    render(<HemoLab locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Cardiogenic or obstructive shock" }));
    expect(screen.getByText(/cannot distinguish from these numbers alone/)).toBeVisible();
  });

  it("moving a slider changes the cardiac output readout", () => {
    render(<HemoLab locale="en" />);
    const readout = () => screen.getByText("Cardiac output").parentElement!.querySelector("p:nth-of-type(2)")!.textContent;
    const before = readout();
    fireEvent.change(screen.getByLabelText(/Heart rate/), { target: { value: "150" } });
    expect(readout()).not.toBe(before);
  });
});
