import { expect, test, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NursingLab } from "@/components/working/nursing-lab";

vi.mock("@/i18n/navigation", () => ({ Link: "a" }));
vi.mock("@/app/[locale]/learning/actions", () => ({}));

test("records a missed shift decision and removes it after a correct retry", () => {
  localStorage.removeItem("icu-nursing-lab-v1:guest");
  render(<NursingLab locale="en" questions={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Start ICU Shift Simulator" }));
  const shift = within(document.getElementById("shift")!);
  const mistakes = within(document.getElementById("mistakes")!);
  fireEvent.click(shift.getByRole("radio", { name: /Review Patient B/ }));
  fireEvent.click(shift.getByRole("button", { name: "Check answer" }));
  expect(shift.getByRole("status")).toHaveTextContent("Review this decision");
  fireEvent.click(mistakes.getByText(/Patient A has a disconnect alarm/));
  fireEvent.click(mistakes.getByRole("link", { name: "Retry in ICU Shift Simulator" }));
  fireEvent.click(shift.getByRole("radio", { name: /Assess Patient A immediately/ }));
  fireEvent.click(shift.getByRole("button", { name: "Check answer" }));
  expect(shift.getByRole("status")).toHaveTextContent("Correct");
  expect(mistakes.getByText(/No missed answers/)).toBeVisible();
  localStorage.removeItem("icu-nursing-lab-v1:guest");
});
