// Synthetic, NONCLINICAL sample content only (fictional devices at a fictional harbour office). No ICU, patient or drug content.
export type Sample = { code: string; title: string; summary: string; parts: { label: string; detail: string }[]; safety: string[]; escalate: string[] };
export const SAMPLES: Sample[] = [
  { code: "SYN-EQ-001", title: "Harbour office display panel and bell", summary: "A fictional display panel with a bell, used only to test the app.",
    parts: [{ label: "Sensor", detail: "Reads the fictional queue length." }, { label: "Display panel", detail: "Shows the queue length as a number and a trend." }, { label: "Limit setting", detail: "The fictional office manager sets the queue limit." }, { label: "Bell", detail: "Rings when the limit is passed." }],
    safety: ["Look at the queue first, then at the panel.", "Do not silence the bell without finding the cause."], escalate: ["Tell the office manager if the bell cannot be explained.", "Write down what you saw and did."] },
  { code: "SYN-EQ-004", title: "Garden drip pump", summary: "A fictional garden watering pump, used only to test the app.",
    parts: [{ label: "Water bag", detail: "Holds the fictional water." }, { label: "Pump", detail: "Pushes the water at the set speed." }, { label: "Blockage sensor", detail: "Notices when the line is blocked." }, { label: "Outlet", detail: "Where the water reaches the plants." }],
    safety: ["Check the set speed against the written plan before starting.", "Never ignore a blockage alarm."], escalate: ["Tell the gardener when the pump stops unexpectedly.", "Write down the volume delivered at each check."] },
  { code: "SYN-EQ-008", title: "Inflatable bench cushion", summary: "A fictional inflatable cushion for a ferry bench, used only to test the app.",
    parts: [{ label: "Air cells", detail: "Take turns filling and emptying." }, { label: "Air pump", detail: "Fills the cells." }, { label: "Mode switch", detail: "Selects firm or soft mode." }, { label: "Low air alarm", detail: "Sounds if the cushion loses air." }],
    safety: ["Check the hose is not trapped.", "Look at the cushion and the person sitting on it, not only at the display."], escalate: ["Tell the facilities team if the low air alarm repeats.", "Write down the mode used."] },
];
