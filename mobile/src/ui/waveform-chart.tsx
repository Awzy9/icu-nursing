import { useMemo, useState } from "react";
import { View } from "react-native";
import { type WaveformTrace } from "../core/waveform";
import { useApp } from "../state/app";
import { P } from "./components";

// Plot original authored time/value pairs using native Views. The old react-native-svg
// Polyline leaves an empty rectangle in the current iOS TestFlight build. Native segments
// remove that renderer dependency for ECG, defibrillator, ventilator and arterial-line labs.
const HEIGHT = 116;
const PAD = 7;
const LINE_WIDTH = 2.5;
type Pt = { x: number; y: number };

function plot(trace: WaveformTrace, width: number): { points: Pt[]; zero: number | null } {
  const maxTime = Math.max(1, ...trace.points.map(([time]) => time));
  const [lo, hi] = trace.domain;
  const span = hi - lo || 1;
  const x = (time: number) => PAD + (time / maxTime) * (width - PAD * 2);
  const y = (value: number) => PAD + (1 - (value - lo) / span) * (HEIGHT - PAD * 2);
  return {
    points: trace.points.map(([time, value]) => ({ x: x(time), y: y(value) })),
    zero: lo <= 0 && hi >= 0 ? y(0) : null,
  };
}

export function WaveformChart({ trace }: { trace: WaveformTrace }) {
  const { palette } = useApp();
  const [width, setWidth] = useState(0);
  const drawing = useMemo(() => width > PAD * 2 ? plot(trace, width) : null, [trace, width]);

  return (
    <View accessibilityRole="image" accessibilityLabel={`${trace.label} versus time, ${trace.unit}`} style={{ gap: 5 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <P small muted>{trace.label}</P>
        <P small muted>{trace.unit}</P>
      </View>
      <View
        onLayout={(event) => {
          const next = Math.round(event.nativeEvent.layout.width);
          setWidth((old) => Math.abs(old - next) > 1 ? next : old);
        }}
        style={{ height: HEIGHT, width: "100%", position: "relative", borderWidth: 1, borderRadius: 8, borderColor: palette.border, backgroundColor: palette.surface, overflow: "hidden" }}
      >
        {drawing ? (
          <>
            {[0.25, 0.5, 0.75].map((fraction) => (
              <View key={fraction} pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: HEIGHT * fraction, height: 1, backgroundColor: palette.border, opacity: 0.35 }} />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map((fraction) => (
              <View key={fraction} pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: width * fraction, width: 1, backgroundColor: palette.border, opacity: 0.3 }} />
            ))}
            {drawing.zero !== null ? (
              <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: drawing.zero, height: 1, backgroundColor: palette.muted, opacity: 0.6 }} />
            ) : null}
            {drawing.points.slice(1).map((next, i) => {
              const from = drawing.points[i]!;
              const dx = next.x - from.x, dy = next.y - from.y;
              const length = Math.hypot(dx, dy);
              if (length < 0.001) return null;
              return (
                <View
                  key={i}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: (from.x + next.x - length) / 2,
                    top: (from.y + next.y - LINE_WIDTH) / 2,
                    width: length,
                    height: LINE_WIDTH,
                    borderRadius: LINE_WIDTH / 2,
                    backgroundColor: palette.primary,
                    transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                  }}
                />
              );
            })}
          </>
        ) : null}
      </View>
    </View>
  );
}
