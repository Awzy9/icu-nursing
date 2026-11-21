import type { WaveformTrace } from "../core/waveform";
// Values, explanations and sample waveforms are copied from the website equipment-detail component.
export const infusionReadings = [
  ["Programmed rate", "40 mL/h", "The volume the pump is set to deliver per hour."],
  ["Remaining VTBI", "60 mL", "The volume still to be infused in this program."],
  ["Volume infused", "20 mL", "The volume the pump has recorded since the displayed counter was last reset."],
  ["Pump status", "Paused", "The programmed rate is still visible. Check the status to determine whether the pump reports delivery."],
] as const;

export const enteralReadings = [
  ["Feed rate", "50 mL/h", "The programmed rate for formula delivery."],
  ["Volume fed", "100 mL", "The amount of formula recorded by the pump. With a feed-and-flush set, review flush volume separately."],
  ["Pump status", "Running", "The pump reports an active feed program. Confirm tube position using the approved method for that tube."],
] as const;


export const pressureTrend = [
  ["Access", "Withdrawal line before the blood pump", "−85", "−86", "−87"],
  ["Filter inlet", "After the blood pump, before blood enters the filter", "135", "155", "175"],
  ["Return", "Blood return line after the filter", "80", "81", "82"],
  ["Effluent", "Effluent side of the filter", "15", "10", "5"],
  ["Filter pressure drop (ΔP)", "Simplified example: filter inlet pressure minus return pressure", "55", "74", "93"],
  ["Transmembrane pressure (TMP)", "Simplified example: mean of filter inlet and return pressures minus effluent pressure", "92.5", "108", "123.5"],
] as const;


export const arterialBeats: { trace: WaveformTrace; detail: string }[] = [
  {
    trace: { label: "Reference beat", unit: "mmHg", domain: [40, 160], points: [[0, 70], [0.07, 78], [0.14, 120], [0.2, 115], [0.31, 98], [0.37, 91], [0.4, 95], [0.48, 89], [0.65, 79], [1, 70]] },
    detail: "Look for a sharp rise, a systolic peak and a small notch on the downslope.",
  },
  {
    trace: { label: "Overdamped beat", unit: "mmHg", domain: [40, 160], points: [[0, 78], [0.07, 80], [0.14, 88], [0.2, 99], [0.31, 104], [0.37, 101], [0.4, 99], [0.48, 94], [0.65, 87], [1, 78]] },
    detail: "The upstroke is slower and the notch is obscured. Compared with the reference, systolic pressure reads lower and diastolic pressure reads higher.",
  },
  {
    trace: { label: "Underdamped beat", unit: "mmHg", domain: [40, 160], points: [[0, 61], [0.07, 77], [0.14, 145], [0.2, 107], [0.31, 119], [0.37, 84], [0.4, 98], [0.48, 82], [0.65, 78], [0.8, 69], [1, 61]] },
    detail: "An exaggerated peak and oscillations can appear. Compared with the reference, systolic pressure reads higher and diastolic pressure reads lower.",
  },
];


export const panels = {
  "EQ-08": {
    title: "Read a powered mattress controller",
    tiles: [
      ["monitor", "Mode", "On the Nimbus 4, Dynamic mode alternates cell pressure. Static mode keeps the cells at a steady support pressure."],
      ["gauge", "Pressure and alarms", "On the Nimbus 4, separate indicators show high or low mattress pressure. Check the exact indicator and follow the instructions for that model."],
    ],
  },
  "EQ-07": {
    title: "Recognise an interrupted feed",
    tiles: [
      ["monitor", "On hold", "The feed program is paused. The programmed rate can still be visible, so read the status before assuming the feed is running."],
      ["gauge", "Flow error", "On the Kangaroo Joey, a flow error can occur when the feeding line is blocked. Read the exact alarm and use the device instructions and local protocol."],
    ],
  },
  "EQ-04": {
    title: "Check the program and interpret the alarm",
    tiles: [
      ["monitor", "Order, label and channel", "Trace the tubing from the container through the selected channel to the patient. Compare the medication, concentration, units, rate and volume to be infused with the order. Obtain an independent check for high-risk infusions when local policy calls for one."],
      ["gauge", "Occlusion", "The pump has detected an obstruction condition. Some devices distinguish between the supply side and the patient side."],
      ["activity", "Air in line", "On pumps with an air detector, this message signals that the detector has registered air in the tubing. Check the exact message and follow the pump instructions and local protocol."],
      ["monitor", "Document the interruption", "Record what the pump reported, when delivery was interrupted, your assessment and whom you notified. If delivery or the infused amount is uncertain, escalate using the unit protocol."],
    ],
  },
  "EQ-02": {
    title: "Read the ventilator display",
    tiles: [
      ["activity", "Pressure and flow", "Compare the start and end of inspiration across the traces. The dashed line on the flow plot marks zero flow."],
      ["droplets", "Volume (mL)", "Read volume on its own scale. The trace shows volume rising during inspiration and falling during expiration in this teaching example."],
      ["monitor", "Respiratory rate", "Read the displayed rate in breaths per minute. Check the label to distinguish the measured total rate from any set rate."],
      ["gauge", "Alarm limits", "On the HAMILTON-C1 pressure/time plot, the high-pressure alarm limit is marked separately from the measured airway pressure trace."],
    ],
  },
  "EQ-01": {
    title: "Interpret the reading, signal and alarm",
    tiles: [
      ["droplets", "SpO₂ (%)", "SpO₂ estimates the percentage of arterial haemoglobin carrying oxygen. Review it alongside the patient’s breathing, level of alertness, and recent trend. SpO₂ gives no direct measurement of ventilation or carbon dioxide."],
      ["activity", "Pulse rate and pleth waveform", "The finger probe derives the pulse rate from blood volume changes at the sensor site. If the waveform becomes erratic, compare the displayed pulse rate with a palpated pulse or another reliable source. Assess the patient while checking the signal."],
      ["monitor", "Factors that can affect accuracy", "Motion, poor circulation at the sensor site, cold skin and nail polish can interfere with readings. Accuracy can also vary with skin pigmentation. Assess unexpected readings or a mismatch with the patient’s condition using your unit’s escalation and confirmation protocols."],
      ["gauge", "Alarm limit", "An upper or lower limit defines when a measurement can trigger a parameter alarm. The current measurement and the configured limit are separate values."],
      ["monitor", "Alarm message", "Read the exact message. A low SpO₂ alarm and a disconnected sensor alert describe different conditions. The device may signal the priority on screen and with a tone."],
    ],
  },
  "EQ-03": {
    title: "Read the arterial pressure waveform",
    tiles: [
      ["activity", "Arterial trace", "Compare the waveform shape with the pressure numbers. Excessive damping can flatten the waveform and lower the displayed systolic pressure."],
      ["gauge", "Level and zero", "Levelling sets the height reference. Zeroing establishes atmospheric pressure as zero. A change in patient or transducer height can affect the reading."],
    ],
  },
  "EQ-05": {
    title: "Read the defibrillator panel",
    tiles: [
      ["activity", "Rhythm and lead", "Identify the ECG tracing and which lead or pads are supplying the signal. In synchronized mode, look for markers aligned with the R waves."],
      ["zap", "Selected energy (J)", "This is the energy selected on the panel. The device shows charging and readiness separately."],
      ["monitor", "Charge status", "On the ZOLL R Series, a ready indication appears when charging is complete. Check the model’s display and audible indicators."],
    ],
  },
  "EQ-06": {
    title: "Read the CRRT treatment display",
    tiles: [
      ["gauge", "Circuit pressures (mmHg)", "Access pressure is measured on the withdrawal side. Return pressure is measured on the patient return side. The PrisMax also displays filter pressure drop and transmembrane pressure (TMP)."],
      ["activity", "Blood flow (mL/min)", "This is the rate of blood moved by the pump through the circuit. Dialysate and replacement fluid have their own flow settings."],
      ["droplets", "Delivered dose and fluid removal", "Compare the reported effluent dose with the prescription over the same period. Account for downtime. Patient fluid removal is a separate value."],
      ["monitor", "Alarm banner", "Read the alarm message and priority together with the pressure trend and treatment status. Colour conventions and messages vary by device."],
      ["gauge", "TMP and filter pressure drop", "TMP describes the pressure difference across the filter membrane. Filter pressure drop describes the pressure difference along the blood path through the filter. Look at both trends alongside blood flow and circuit observations."],
      ["monitor", "Document and escalate", "Capture the exact alarm, time, pressure trends, treatment interruption and patient assessment. Use the machine instructions and unit protocol to decide when to involve the CRRT team."],
    ],
  },
} as const;