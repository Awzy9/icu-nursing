import { View } from "react-native";
import Svg, { Line, Polyline } from "react-native-svg";
import { tracePolyline, zeroLineY, type WaveformTrace } from "../core/waveform";
import { useApp } from "../state/app";
import { P } from "./components";

const WIDTH = 480, HEIGHT = 90;

// Mirrors src/components/working/waveform-chart.tsx exactly: an authored diagram (straight lines
// between real [time, value] points via tracePolyline), not a generated image. Shared by every
// lab built on a waveform trace (ECG, ventilator/hemodynamics waveforms, arterial-line, defib).
export function WaveformChart({ trace }: { trace: WaveformTrace }) {
  const { palette } = useApp();
  const points = tracePolyline(trace, WIDTH, HEIGHT);
  const zeroY = zeroLineY(trace, HEIGHT);
  return (
    <View accessibilityRole="image" accessibilityLabel={`${trace.label} versus time, ${trace.unit}`} style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <P small muted>{trace.label}</P>
        <P small muted>{trace.unit}</P>
      </View>
      <Svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={96} style={{ borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }}>
        {zeroY !== null ? <Line x1={0} x2={WIDTH} y1={zeroY} y2={zeroY} stroke={palette.border} strokeWidth={1} strokeDasharray="3 3" /> : null}
        <Polyline points={points} fill="none" stroke={palette.primary} strokeWidth={2} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}
