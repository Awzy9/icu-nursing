import { Activity, Droplets, Gauge, Monitor, Zap } from "lucide-react";
import { waveformExercise } from "@/lib/working/waveform";
import { WaveformChart } from "./waveform-chart";

const prisMaxManual = "https://usrenalacute.baxter.com/sites/g/files/ebysai3231/files/2020-12/Prismax%20Operator%27s%20Manual.pdf";
const zollManual = "https://www.zoll.com/-/media/LegacyMedia/public-site/products/r-series-defibrillators/9650-0912-06-sf_j.ashx";
const arterialArticle = "https://pmc.ncbi.nlm.nih.gov/articles/PMC7183114/";

const references = {
  "EQ-02": [
    ["HAMILTON-C1 operator’s manual · Waveform display and pressure/time graph (figure 6-6)", "https://www.hamilton-medical.com/dam/jcr%3Ae8fbf16e-0e4b-47b1-a093-d896a1fbb14a/HAMILTON-C1-ops-manual-SW2.2x-en-624326.05.pdf"],
  ],
  "EQ-01": [
    ["Masimo RD SET reusable finger sensor photo", "https://www.masimo.com/products/sensors/rd-set/reusables/"],
    ["Masimo Radical-7 operator’s manual · Chapter 6, Alarms and Messages", "https://techdocs.masimo.com/globalassets/techdocs/pdf/lab-5476l_master.pdf"],
  ],
  "EQ-03": [
    ["Saugel et al., Critical Care (2020) · Transducer and waveform figures", arterialArticle],
  ],
  "EQ-05": [["ZOLL R Series ALS operator’s guide · Front panel and rhythm display", zollManual]],
  "EQ-06": [
    ["Vantive PrisMax · Machine photos", "https://pro.vantive.com/prismax-critical-care-system"],
    ["Baxter PrisMax operator’s manual · Monitored data display, p. 75", prisMaxManual + "#page=75"],
  ],
} as const;

const panels = {
  "EQ-02": {
    title: "Read the ventilator display",
    tiles: [
      [Activity, "Pressure and flow", "Compare the start and end of inspiration across the traces. The dashed line on the flow plot marks zero flow."],
      [Droplets, "Volume (mL)", "Read volume on its own scale. The trace shows volume rising during inspiration and falling during expiration in this teaching example."],
      [Monitor, "Respiratory rate", "Read the displayed rate in breaths per minute. Check the label to distinguish the measured total rate from any set rate."],
      [Gauge, "Alarm limits", "On the HAMILTON-C1 pressure/time plot, the high-pressure alarm limit is marked separately from the measured airway pressure trace."],
    ],
  },
  "EQ-01": {
    title: "Distinguish the reading, alarm limit and alarm message",
    tiles: [
      [Gauge, "Alarm limit", "An upper or lower limit defines when a measurement can trigger a parameter alarm. The current measurement and the configured limit are separate values."],
      [Monitor, "Alarm message", "Read the exact message. A low SpO₂ alarm and a disconnected sensor alert describe different conditions. The device may signal the priority on screen and with a tone."],
    ],
  },
  "EQ-03": {
    title: "Read the arterial pressure waveform",
    tiles: [
      [Activity, "Arterial trace", "Compare the waveform shape with the pressure numbers. Excessive damping can flatten the waveform and lower the displayed systolic pressure."],
      [Gauge, "Level and zero", "Levelling sets the height reference. Zeroing establishes atmospheric pressure as zero. A change in patient or transducer height can affect the reading."],
    ],
  },
  "EQ-05": {
    title: "Read the defibrillator panel",
    tiles: [
      [Activity, "Rhythm and lead", "Identify the ECG tracing and which lead or pads are supplying the signal. In synchronized mode, look for markers aligned with the R waves."],
      [Zap, "Selected energy (J)", "This is the energy selected on the panel. The device shows charging and readiness separately."],
      [Monitor, "Charge status", "On the ZOLL R Series, a ready indication appears when charging is complete. Check the model’s display and audible indicators."],
    ],
  },
  "EQ-06": {
    title: "Read the CRRT treatment display",
    tiles: [
      [Gauge, "Circuit pressures (mmHg)", "Access pressure is measured on the withdrawal side. Return pressure is measured on the patient return side. The PrisMax also displays filter pressure drop and transmembrane pressure (TMP)."],
      [Activity, "Blood flow (mL/min)", "This is the rate of blood moved by the pump through the circuit. Dialysate and replacement fluid have their own flow settings."],
      [Droplets, "Delivered dose and fluid removal", "Compare the reported effluent dose with the prescription over the same period. Account for downtime. Patient fluid removal is a separate value."],
      [Monitor, "Alarm banner", "Read the alarm message and priority together with the pressure trend and treatment status. Colour conventions and messages vary by device."],
    ],
  },
} as const;

export function EquipmentDetail({ moduleKey, parameters }: { moduleKey: string; parameters: boolean }) {
  const links = references[moduleKey as keyof typeof references];
  const panel = parameters ? panels[moduleKey as keyof typeof panels] : undefined;
  if (!links) return null;
  const teachingBreath = parameters && moduleKey === "EQ-02" ? waveformExercise("WV-01") : undefined;

  return (
    <div lang="en" dir="ltr" className="mb-8 space-y-4 rounded-xl border border-border bg-muted p-4 sm:p-5">
      {teachingBreath && (
        <section aria-label="Example ventilator waveforms" className="space-y-3">
          <h3 className="font-semibold">Follow one breath across three waveforms</h3>
          <p className="text-sm text-muted-foreground">Simulated breath. Time runs left to right on all three traces.</p>
          {teachingBreath.traces.map((trace) => <WaveformChart key={trace.label} trace={trace} locale="en" />)}
          <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
            {teachingBreath.accessibleDescription.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
      )}
      {panel && (
        <>
          <h3 className="font-semibold">{panel.title}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {panel.tiles.map(([Icon, label, detail]) => (
              <li key={label} className="rounded-lg border border-border bg-card p-4">
                <Icon aria-hidden="true" className="mb-2 size-5 text-primary" />
                <p className="font-semibold">{label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
              </li>
            ))}
          </ul>
        </>
      )}
      <ul className="space-y-2 text-sm">
        {links.map(([label, href]) => <li key={href}><a className="text-primary underline" href={href}>{label}</a></li>)}
      </ul>
    </div>
  );
}
