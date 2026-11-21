import { useState } from "react";
import { View } from "react-native";
import { arterialBeats, enteralReadings, infusionReadings, panels, pressureTrend } from "../content/equipment-teaching";
import { useWaveformExercises } from "../hooks/useRemoteContent";
import { Button, Callout, Card, H2, P } from "./components";
import { WaveformChart } from "./waveform-chart";
import { space } from "./theme";

const teaching = panels as Record<string, { readonly title: string; readonly tiles: readonly (readonly [string, string, string])[] }>;
type Reading = readonly (readonly [string, string, string])[];

function ReadableDisplay({ title, readings }: { title: string; readings: Reading }) {
  return (
    <Card>
      <P small>{title}</P>
      <P small muted>Simulated display. Values are fictional examples for reading practice.</P>
      {readings.map(([label, value, detail]) => (
        <Card key={label}>
          <P>{label}</P>
          <P>{value}</P>
          <P small muted>{detail}</P>
        </Card>
      ))}
    </Card>
  );
}

function CrrtPressurePanel() {
  return (
    <Card>
      <H2>Connect the pressures to the CRRT circuit</H2>
      <P small muted>Three fictional time points (mmHg) for learning; simplified formulas are model-specific.</P>
      {pressureTrend.map(([label, where, ...values]) => (
        <Card key={label}>
          <P>{label}</P>
          <P small muted>{where}</P>
          <View style={{ flexDirection: "row", justifyContent: "space-around", flexWrap: "wrap", gap: space.md }}>
            {values.map((value, i) => <P key={i}>{i * 15} min: {value}</P>)}
          </View>
        </Card>
      ))}
      <P small>In this example, filter inlet pressure and the filter pressure drop increase while return pressure changes little. TMP also rises. Review blood flow, alarms and the actual machine's documented calculations before interpreting a real circuit.</P>
    </Card>
  );
}

function SupportSurfacePanel() {
  const [phase, setPhase] = useState(0);
  return (
    <Card>
      <H2>Compare support surfaces</H2>
      <P>Reactive foam distributes load by conforming to the patient.</P>
      <P>Active alternating-pressure cells change inflation in timed groups.</P>
      <View style={{ flexDirection: "row", gap: 4, minHeight: 64, alignItems: "flex-end" }}>
        {[0, 1, 0, 1, 0, 1].map((group, i) => (
          <View key={i} accessibilityLabel={`Air cell ${i + 1}`} style={{ flex: 1, height: group === phase ? 52 : 24, borderRadius: 12, backgroundColor: group === phase ? "#38bdf8" : "#64748b" }} />
        ))}
      </View>
      <P small>{phase === 0 ? "Phase 1: the first group is inflated more." : "Phase 2: the alternate group is inflated more."}</P>
      <Button label="Show next phase" variant="outline" onPress={() => setPhase(1 - phase)} />
    </Card>
  );
}

export function VentilatorAlarmComparison() {
  const exercises = useWaveformExercises();
  if (exercises.status !== "ready") return <P small muted>Open the Ventilator Waveforms lab to explore these traces.</P>;
  const normal = exercises.data.find((item) => item.key === "WV-01")?.traces.find((trace) => trace.unit === "L/min");
  const incomplete = exercises.data.find((item) => item.key === "WV-02")?.traces.find((trace) => trace.unit === "L/min");
  if (!normal || !incomplete) return <P small muted>Comparison traces unavailable. Try again when connected.</P>;
  return (
    <Card>
      <H2>Compare expiratory flow before the next breath</H2>
      <P small muted>Simulated flow traces share the same reference scale. Zero flow is marked by a horizontal line.</P>
      <WaveformChart trace={{ ...normal, label: "Expiratory flow returns to zero" }} />
      <WaveformChart trace={{ ...incomplete, label: "Flow stays below zero before next breath" }} />
      <P small>In the second trace, expiration is incomplete as the next inspiration begins. This may suggest air trapping, but the waveform alone does not quantify intrinsic PEEP.</P>
      <Callout tone="info">For any alarm, assess the patient and actual ventilation first. Review the alarm message, chest movement, measured exhaled volume, waveform trends and circuit with the ICU team.</Callout>
    </Card>
  );
}

export function EquipmentTeaching({ moduleKey }: { moduleKey: string }) {
  const data = teaching[moduleKey];
  const waveformData = useWaveformExercises();
  if (!data) return null;
  const breath = moduleKey === "EQ-02" && waveformData.status === "ready"
    ? waveformData.data.find((item) => item.key === "WV-01") : undefined;

  return (
    <View style={{ gap: space.md }}>
      {moduleKey === "EQ-04" ? <ReadableDisplay title="Compare the infusion readings" readings={infusionReadings} /> : null}
      {moduleKey === "EQ-07" ? <ReadableDisplay title="Read an enteral feeding pump display" readings={enteralReadings} /> : null}
      {moduleKey === "EQ-06" ? <CrrtPressurePanel /> : null}
      {moduleKey === "EQ-08" ? <SupportSurfacePanel /> : null}
      {moduleKey === "EQ-03" ? (
        <Card>
          <H2>Compare arterial waveforms</H2>
          <P small muted>Simulated beats. All use the same 0–1 second time axis and 40–160 mmHg scale.</P>
          {arterialBeats.map(({ trace, detail }) => <View key={trace.label} style={{ gap: space.xs }}><WaveformChart trace={trace} /><P small muted>{detail}</P></View>)}
          <Callout tone="info">When damping changes, assess the patient and the monitoring setup before interpreting a pressure trend.</Callout>
        </Card>
      ) : null}
      {breath?.traces?.length ? (
        <Card>
          <H2>Follow one ventilator breath across three traces</H2>
          <P small muted>Pressure, flow and volume are displayed against time using their individual scales.</P>
          {breath.traces.map((trace) => <WaveformChart key={trace.label} trace={trace} />)}
        </Card>
      ) : null}
      <Card>
        <H2>{data.title}</H2>
        {data.tiles.map(([_, label, detail]) => (
          <View key={label} style={{ gap: space.xs, paddingVertical: space.sm }}>
            <P>{label}</P>
            <P small muted>{detail}</P>
          </View>
        ))}
      </Card>
    </View>
  );
}
