// Shared educational practice dataset ported without changing answer keys or clinical rationale.
import type { WaveformTrace } from "../core/waveform";

export const expiratoryFlowExamples: WaveformTrace[] = [
  { label: "Trace A", unit: "L/min", domain: [-50, 50], points: [[0, 40], [0.8, 40], [0.8, -45], [1.2, -25], [1.6, -10], [2, 0], [3, 0], [3, 40]] },
  { label: "Trace B", unit: "L/min", domain: [-50, 50], points: [[0, 40], [0.8, 40], [0.8, -45], [1.2, -32], [1.6, -25], [2, -19], [3, -11], [3, 40]] },
];

export const activities = [
  {
    id: "shift",
    title: "ICU Shift Simulator",
    intro: "Night shift. Two fictional patients need your attention. Decide which change takes priority, then reassess as new information arrives.",
    source: { label: "AARC · Patient–ventilator assessment", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11298231/" },
    steps: [
      {
        prompt: "Patient A has a disconnect alarm, no visible chest rise and a rapidly falling saturation. Patient B now needs more oxygen than at handover, but is awake and speaking. What do you do first?",
        monitor: [
          { patient: "Patient A", readings: [["SpO₂ trend", "96% → 84%"], ["Ventilator", "Disconnect alarm"], ["Chest rise", "Absent"]] },
          { patient: "Patient B", readings: [["SpO₂ trend", "94% → 94%"], ["Oxygen flow", "2 → 4 L/min"], ["Response", "Awake and speaking"]] },
        ],
        choices: ["Assess Patient A immediately and call for help while arranging prompt assessment of Patient B.", "Review Patient B’s chart before checking either patient.", "Silence Patient A’s alarm and wait for another reading."],
        answer: 0,
        why: "The alarm is accompanied by absent chest rise and rapid deterioration. Patient A needs immediate airway and breathing assessment. Asking a colleague to assess Patient B keeps the second concern from being delayed.",
      },
      {
        prompt: "The team finds and corrects a disconnected circuit. Chest rise returns. What tells you that ventilation has recovered?",
        choices: ["The alarm stops.", "Chest movement, exhaled tidal volume and oxygenation recover toward baseline.", "The programmed ventilator settings still match the chart."],
        answer: 1,
        why: "Reassess the patient and measured ventilation after correcting the circuit. Settings show what was programmed, while chest movement and exhaled volume help establish what is actually being delivered.",
      },
      {
        prompt: "Patient A is stable. Patient B’s saturation is back in target on more oxygen than at handover, and breathing effort has increased. What now?",
        monitor: [
          { patient: "Patient A", readings: [["Chest rise", "Returned"], ["Ventilation", "Recovered toward baseline"]] },
          { patient: "Patient B", readings: [["SpO₂", "In prescribed range"], ["Oxygen flow", "Above handover level"], ["Breathing effort", "Increased"]] },
        ],
        choices: ["Wait for saturation to fall below target.", "Record the saturation alone at the next routine round.", "Reassess promptly and escalate the rising oxygen requirement and increased effort."],
        answer: 2,
        why: "A target saturation achieved with more support can hide a worsening trend. Report the device and flow now and at baseline, together with respiratory effort and alertness.",
      },
    ],
  },
  {
    id: "medication-checks",
    title: "High-Alert Medication Checks",
    intro: "Compare fictional orders, bag labels, pump displays and line labels for discrepancies.",
    source: { label: "FDA · Infusion pump risk reduction", href: "https://www.fda.gov/medical-devices/infusion-pumps/infusion-pump-risk-reduction-strategies-clinicians" },
    steps: [
      {
        prompt: "Which entry differs from the order and prepared bag?",
        readouts: [["Order", "Drug A · 4 mg/mL"], ["Bag label", "Drug A · 4 mg/mL"], ["Pump display", "Drug A · 2 mg/mL"]],
        choices: ["The pump concentration.", "Only the bag volume.", "Only the channel name."],
        answer: 0,
        why: "The pump’s concentration differs from the prepared solution. Reconcile the order, label and pump program before starting the fictional infusion.",
      },
      {
        prompt: "What is the discrepancy between the order and the pump?",
        readouts: [["Order", "Drug A · micrograms/min"], ["Pump display", "Drug A · milligrams/h"]],
        choices: ["The drug name.", "Both the mass unit and the time unit.", "The line label only."],
        answer: 1,
        why: "A matching number is insufficient when the mass and time units differ. Verify the prescribed units and pump mode.",
      },
      {
        prompt: "The line trace ends at a different lumen from the one documented. What should be verified?",
        readouts: [["Bag and pump", "Drug A"], ["Documented connection", "Lumen A"], ["Observed connection", "Lumen B"]],
        choices: ["Only the displayed rate.", "Only the pump’s remaining volume.", "The full tubing route and intended connection."],
        answer: 2,
        why: "Trace the tubing from the container through its pump channel to the patient connection. Matching labels at the pump do not establish where the line ends.",
      },
    ],
  },
  {
    id: "visual-skills",
    title: "Visual Skills Lab",
    intro: "Use equipment photos and simulated waveforms to identify components and interpret bedside clues.",
    steps: [
      {
        equipment: "EQ-04",
        prompt: "On the syringe pump above, which component physically advances the syringe plunger?",
        choices: ["The display.", "The syringe plunger drive.", "The downstream connector."],
        answer: 1,
        why: "The drive engages the syringe plunger. The display presents programmed and measured information.",
      },
      {
        equipment: "EQ-03",
        prompt: "Trace the arterial monitoring setup. Which component converts the fluid pressure signal into an electrical signal?",
        choices: ["The pressure transducer.", "The dressing.", "The display cable."],
        answer: 0,
        why: "The transducer converts pressure in the fluid-filled tubing into a signal for the monitor.",
      },
      {
        equipment: "EQ-05",
        prompt: "Where would you look to see the ECG waveform on this device?",
        choices: ["On the front-panel screen.", "On the power connector.", "On the carrying handle."],
        answer: 0,
        why: "The front-panel screen shows the ECG waveform. Verify which lead or pad source the device is displaying before interpreting the trace.",
      },
      {
        flowComparison: true,
        prompt: "Which trace suggests that exhalation was still in progress when the next breath began?",
        choices: ["Trace A.", "Trace B.", "Both traces."],
        answer: 1,
        why: "In Trace B, expiratory flow is still below zero immediately before the next inspiration. This pattern suggests incomplete exhalation and possible air trapping. The waveform alone does not quantify intrinsic PEEP.",
      },
    ],
  },
] as const;

export const orientation = [
  { title: "Read the bedside monitor", lesson: "EQ-01", practice: "#visual-skills" },
  { title: "Check an infusion pump", lesson: "SK-22", practice: "#medication-checks" },
  { title: "Recognise deteriorating perfusion", lesson: "D02-T08", practice: "/hemo-lab" },
  { title: "Respond to a ventilator alarm", lesson: "D01-T09", practice: "#shift" },
] as const;
