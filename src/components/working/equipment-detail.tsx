import { useState } from "react";
import { Activity, Droplets, Gauge, Monitor, Zap } from "lucide-react";
import { waveformExercise } from "@/lib/working/waveform";
import { WaveformChart } from "./waveform-chart";

const prisMaxManual = "https://usrenalacute.baxter.com/sites/g/files/ebysai3231/files/2020-12/Prismax%20Operator%27s%20Manual.pdf";
const zollManual = "https://www.zoll.com/-/media/LegacyMedia/public-site/products/r-series-defibrillators/9650-0912-06-sf_j.ashx";
const arterialArticle = "https://pmc.ncbi.nlm.nih.gov/articles/PMC7183114/";

const references = {
  "EQ-08": [
    ["International Guideline, 4th edition · Full-body support surfaces", "https://static1.squarespace.com/static/6479484083027f25a6246fcb/t/6aa1d3b8d615723ca31f8de9/1788990393971/NPIAP-EPUAP-PPPIA-Quick-Ref-2026-FINAL.pdf"],
    ["Arjo Nimbus 4 and Nimbus Professional · Controls and pressure indicators", "https://qbank.arjo.com/productdocumentation/649934EN_06.pdf"],
  ],
  "EQ-04": [
    ["B. Braun Infusomat Space P instructions for use · Typical display during infusion", "https://cloud-bbraun-ch.dispatcher.qas.cw.bbraun.com/content/dam/catalog/bbraun/bbraunProductCatalog/CW_CH/de-ch/b12/infusomat-space-pundzubehoer0.pdf"],
    ["FDA · Infusion pump risk reduction strategies for clinicians", "https://www.fda.gov/medical-devices/infusion-pumps/infusion-pump-risk-reduction-strategies-clinicians"],
  ],
  "EQ-02": [
    ["HAMILTON-C1 operator’s manual · Waveform display and pressure/time graph (figure 6-6)", "https://www.hamilton-medical.com/dam/jcr%3Ae8fbf16e-0e4b-47b1-a093-d896a1fbb14a/HAMILTON-C1-ops-manual-SW2.2x-en-624326.05.pdf"],
  ],
  "EQ-01": [
    ["FDA · Pulse oximeter accuracy and limitations", "https://www.fda.gov/medical-devices/products-and-medical-procedures/pulse-oximeters"],
    ["WHO · Pulse oximetry training manual (PDF)", "https://cdn.who.int/media/docs/default-source/patient-safety/pulse-oximetry/who-ps-pulse-oxymetry-training-manual-en.pdf"],
    ["Masimo RD SET reusable finger sensor photo", "https://www.masimo.com/products/sensors/rd-set/reusables/"],
    ["Masimo Radical-7 operator’s manual · Chapter 6, Alarms and Messages", "https://techdocs.masimo.com/globalassets/techdocs/pdf/lab-5476l_master.pdf"],
  ],
  "EQ-03": [
    ["Saugel et al., Critical Care (2020) · Transducer and waveform figures", arterialArticle],
  ],
  "EQ-05": [["ZOLL R Series ALS operator’s guide · Front panel and rhythm display", zollManual]],
  "EQ-06": [
    ["Vantive PrisMax · Annotated manufacturer display", "https://prismax.vantive.com/en-us/guides/main-operations-screen/operation-parameters"],
    ["Vantive PrisMax · Machine photos", "https://pro.vantive.com/prismax-critical-care-system"],
    ["Baxter PrisMax operator’s manual · Monitored data display, p. 75", prisMaxManual + "#page=75"],
  ],
  "EQ-07": [
    ["Kangaroo Joey operating manual · Continuous mode, display figures and flow errors", "https://www.lincare.com/-/media/Project/Lincare/Files/Enteral-Devices/Kangaroo-Joey-Enteral-feeding-pump-Operating-Manual.pdf"],
  ],
} as const;

const infusionReadings = [
  ["Programmed rate", "40 mL/h", "The volume the pump is set to deliver per hour."],
  ["Remaining VTBI", "60 mL", "The volume still to be infused in this program."],
  ["Volume infused", "20 mL", "The volume the pump has recorded since the displayed counter was last reset."],
  ["Pump status", "Paused", "The programmed rate is still visible. Check the status to determine whether the pump reports delivery."],
] as const;

const enteralReadings = [
  ["Feed rate", "50 mL/h", "The programmed rate for formula delivery."],
  ["Volume fed", "100 mL", "The amount of formula recorded by the pump. With a feed-and-flush set, review flush volume separately."],
  ["Pump status", "Running", "The pump reports an active feed program. Confirm tube position using the approved method for that tube."],
] as const;

function PumpDisplay({ title, readings }: { title: string; readings: readonly (readonly [string, string, string])[] }) {
  return (
    <figure className="space-y-3">
      <figcaption>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">Simulated display with example values for reading practice.</p>
      </figcaption>
      <dl className="grid gap-3 rounded-xl border border-slate-600 bg-slate-950 p-4 text-slate-100 sm:grid-cols-3">
        {readings.map(([label, value, detail]) => (
          <div key={label} className="min-w-0 rounded-lg border border-slate-700 bg-slate-900 p-3">
            <dt className="text-sm font-medium text-slate-200">{label}</dt>
            <dd className="mt-1 space-y-2">
              <span className="block text-xl font-semibold tabular-nums text-cyan-300">{value}</span>
              <span className="block text-sm text-slate-300">{detail}</span>
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

const pressureTrend = [
  ["Access", "Withdrawal line before the blood pump", "−85", "−86", "−87"],
  ["Filter inlet", "After the blood pump, before blood enters the filter", "135", "155", "175"],
  ["Return", "Blood return line after the filter", "80", "81", "82"],
  ["Effluent", "Effluent side of the filter", "15", "10", "5"],
  ["Filter pressure drop (ΔP)", "Filter inlet pressure minus return pressure", "55", "74", "93"],
] as const;

function CrrtPressureDisplay() {
  return (
    <figure className="space-y-3">
      <figcaption>
        <h3 className="font-semibold">Connect the pressures to the circuit</h3>
        <p className="text-sm text-muted-foreground">Simulated readings in mmHg at three points in time. These values are examples for interpretation practice.</p>
      </figcaption>
      <div className="space-y-2 rounded-xl border border-slate-600 bg-slate-950 p-3 text-slate-100">
        {pressureTrend.map(([label, location, ...readings]) => (
          <div key={label} className="space-y-2 rounded-lg border border-slate-700 bg-slate-900 p-3">
            <p className="font-semibold">{label}</p>
            <p className="text-sm text-slate-300">{location}</p>
            <dl className="grid grid-cols-3 gap-2 text-center">
              {readings.map((value, index) => (
                <div key={index}>
                  <dt className="text-xs text-slate-300">{index * 15} min</dt>
                  <dd className="font-semibold tabular-nums text-cyan-300">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <p className="text-sm leading-relaxed">
        In this example, filter inlet pressure rises while return pressure barely changes, so the pressure drop across the filter increases.
        Compare that trend with blood flow, TMP, the alarm message and circuit observations before drawing conclusions about the cause.
      </p>
    </figure>
  );
}

function SupportSurfaceVisual() {
  const [phase, setPhase] = useState(0);

  return (
    <figure className="space-y-4">
      <figcaption>
        <h3 className="font-semibold">Compare foam and alternating-pressure air</h3>
        <p className="text-sm text-muted-foreground">Simplified cross-sections of two support surfaces.</p>
      </figcaption>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <p className="font-semibold">Reactive foam</p>
          <div aria-hidden="true" className="flex h-12 items-end">
            <div className="h-8 w-full rounded-md border-2 border-sky-500 bg-sky-500/20" />
          </div>
          <p className="text-sm text-muted-foreground">Foam conforms under load and spreads it over a larger area.</p>
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <p className="font-semibold">Active alternating-pressure air</p>
          <div aria-hidden="true" className="flex h-12 items-end gap-1">
            {[0, 1, 0, 1, 0, 1].map((group, index) => (
              <div key={index} className={`min-w-0 flex-1 rounded-full border-2 border-primary ${group === phase ? "h-12 bg-primary/25" : "h-6 bg-primary/10"}`} />
            ))}
          </div>
          <p role="status" className="text-sm text-muted-foreground">
            {phase === 0 ? "Phase 1. The first group of cells is more inflated." : "Phase 2. The second group of cells is more inflated."}
          </p>
          <button type="button" className="min-h-11 rounded-lg border border-border px-3 text-sm font-semibold" onClick={() => setPhase(1 - phase)}>
            Show next phase
          </button>
        </div>
      </div>
    </figure>
  );
}

export function VentilatorAlarmVisual() {
  const normal = waveformExercise("WV-01")?.traces.find((trace) => trace.unit === "L/min");
  const incomplete = waveformExercise("WV-02")?.traces.find((trace) => trace.unit === "L/min");
  if (!normal || !incomplete) return null;

  return (
    <section lang="en" dir="ltr" aria-labelledby="alarm-flow-title" className="mb-6 space-y-3 rounded-xl border border-border bg-muted p-4">
      <h3 id="alarm-flow-title" className="font-semibold">Compare expiratory flow before the next breath</h3>
      <p className="text-sm text-muted-foreground">Simulated flow traces. The dashed line is zero flow. Time runs left to right.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <WaveformChart trace={{ ...normal, label: "Expiratory flow returns to zero" }} locale="en" />
        <WaveformChart trace={{ ...incomplete, label: "Expiratory flow remains below zero" }} locale="en" />
      </div>
      <p className="text-sm leading-relaxed">
        In the second trace, expiration is still in progress when the next inspiration starts. This can suggest incomplete exhalation.
        Assess the patient, check whether the pattern repeats, and review it with the respiratory therapist or ICU team.
      </p>
      <h4 className="font-semibold">Read the alarm in context</h4>
      <p className="text-sm leading-relaxed">
        A high-pressure message refers to the airway pressure the ventilator detected. Compare it with the recent trend,
        the patient’s chest movement and effort, and visible circuit findings. A low exhaled-volume message refers to the
        volume measured during exhalation. Compare it with recent breaths and look for signs of a leak or disconnection with the bedside team.
        After the alarm clears, reassess the patient and confirm whether the measured trend has recovered.
      </p>
      <ul className="space-y-1 text-sm">
        <li><a className="text-primary underline" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11298231/">AARC · Patient–Ventilator Assessment</a></li>
        <li><a className="text-primary underline" href="https://www.hamilton-medical.com/dam/jcr%3A79e1c664-24e6-4dc7-8113-941781843520/HAMILTON-C1-ops-manual-SW3.0.x-en-10101866.00.pdf">HAMILTON-C1 SW 3.0.x · Troubleshooting alarms (PDF)</a></li>
      </ul>
    </section>
  );
}

const panels = {
  "EQ-08": {
    title: "Read a powered mattress controller",
    tiles: [
      [Monitor, "Mode", "On the Nimbus 4, Dynamic mode alternates cell pressure. Static mode keeps the cells at a steady support pressure."],
      [Gauge, "Pressure and alarms", "On the Nimbus 4, separate indicators show high or low mattress pressure. Check the exact indicator and follow the instructions for that model."],
    ],
  },
  "EQ-07": {
    title: "Recognise an interrupted feed",
    tiles: [
      [Monitor, "On hold", "The feed program is paused. The programmed rate can still be visible, so read the status before assuming the feed is running."],
      [Gauge, "Flow error", "On the Kangaroo Joey, a flow error can occur when the feeding line is blocked. Read the exact alarm and use the device instructions and local protocol."],
    ],
  },
  "EQ-04": {
    title: "Check the program and interpret the alarm",
    tiles: [
      [Monitor, "Order, label and channel", "Trace the tubing from the container through the selected channel to the patient. Compare the medication, concentration, units, rate and volume to be infused with the order. Obtain an independent check for high-risk infusions when local policy calls for one."],
      [Gauge, "Occlusion", "The pump has detected an obstruction condition. Some devices distinguish between the supply side and the patient side."],
      [Activity, "Air in line", "On pumps with an air detector, this message signals that the detector has registered air in the tubing. Check the exact message and follow the pump instructions and local protocol."],
      [Monitor, "Document the interruption", "Record what the pump reported, when delivery was interrupted, your assessment and whom you notified. If delivery or the infused amount is uncertain, escalate using the unit protocol."],
    ],
  },
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
    title: "Interpret the reading, signal and alarm",
    tiles: [
      [Droplets, "SpO₂ (%)", "SpO₂ estimates the percentage of arterial haemoglobin carrying oxygen. Review it alongside the patient’s breathing, level of alertness, and recent trend. SpO₂ gives no direct measurement of ventilation or carbon dioxide."],
      [Activity, "Pulse rate and pleth waveform", "The finger probe derives the pulse rate from blood volume changes at the sensor site. If the waveform becomes erratic, compare the displayed pulse rate with a palpated pulse or another reliable source. Assess the patient while checking the signal."],
      [Monitor, "Factors that can affect accuracy", "Motion, poor circulation at the sensor site, cold skin and nail polish can interfere with readings. Accuracy can also vary with skin pigmentation. Assess unexpected readings or a mismatch with the patient’s condition using your unit’s escalation and confirmation protocols."],
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
      [Gauge, "TMP and filter pressure drop", "TMP describes the pressure difference across the filter membrane. Filter pressure drop describes the pressure difference along the blood path through the filter. Look at both trends alongside blood flow and circuit observations."],
      [Monitor, "Document and escalate", "Capture the exact alarm, time, pressure trends, treatment interruption and patient assessment. Use the machine instructions and unit protocol to decide when to involve the CRRT team."],
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
      {parameters && moduleKey === "EQ-04" && <PumpDisplay title="Compare the three infusion readings" readings={infusionReadings} />}
      {parameters && moduleKey === "EQ-06" && <CrrtPressureDisplay />}
      {parameters && moduleKey === "EQ-07" && <PumpDisplay title="Read an enteral feeding pump display" readings={enteralReadings} />}
      {parameters && moduleKey === "EQ-08" && <SupportSurfaceVisual />}
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
