import React from "react";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { useApp } from "../state/app";

const W = 480, H = 200;
/** Original generic schematic (loop, signal trace or flow path). It carries no manufacturer artwork; the text alternative is the accessibility label. */
export function Diagram({ kind, count, selected, alt }: { kind: "loop" | "signal" | "flow"; count: number; selected: number | null; alt: string }) {
  const { palette, rtl } = useApp();
  const fx = (x: number) => (rtl ? W - x : x);
  const on = (i: number) => selected === i;
  const stroke = (i: number) => (on(i) ? palette.primary : palette.text);
  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={180} accessible accessibilityRole="image" accessibilityLabel={alt}>
      {kind === "signal" ? (
        <G fill="none" strokeWidth={2.5}>
          <Line x1={fx(20)} y1={150} x2={fx(460)} y2={150} stroke={stroke(count - 1)} strokeDasharray="6 4" />
          <Path d={`M${fx(20)} 150 C${fx(80)} 150 ${fx(100)} 40 ${fx(150)} 40`} stroke={stroke(0)} />
          <Circle cx={fx(150)} cy={40} r={7} fill={on(1) ? palette.primary : palette.text} stroke="none" />
          <Path d={`M${fx(150)} 40 C${fx(200)} 40 ${fx(220)} 150 ${fx(280)} 150`} stroke={stroke(2)} />
          <Path d={`M${fx(280)} 150 C${fx(330)} 150 ${fx(350)} 40 ${fx(400)} 40 C${fx(430)} 40 ${fx(440)} 150 ${fx(460)} 150`} stroke={palette.border} />
        </G>
      ) : (
        <G>
          {Array.from({ length: count }, (_, i) => {
            const pos = (k: number) => (kind === "flow"
              ? { x: 60 + k * ((W - 120) / Math.max(1, count - 1)), y: H / 2 }
              : { x: W / 2 + 120 * Math.cos((2 * Math.PI * k) / count - Math.PI / 2), y: H / 2 + 70 * Math.sin((2 * Math.PI * k) / count - Math.PI / 2) });
            const a = pos(i), b = pos((i + 1) % count);
            return (
              <G key={i}>
                {kind === "flow" && i === count - 1 ? null : <Line x1={fx(a.x)} y1={a.y} x2={fx(b.x)} y2={b.y} stroke={palette.border} strokeWidth={2} />}
                <Circle cx={fx(a.x)} cy={a.y} r={22} fill={on(i) ? palette.primary : palette.surface} stroke={palette.text} strokeWidth={2} />
                <SvgText x={fx(a.x)} y={a.y + 6} textAnchor="middle" fontSize={16} fontWeight="700" fill={on(i) ? palette.onPrimary : palette.text}>{String(i + 1)}</SvgText>
              </G>
            );
          })}
        </G>
      )}
    </Svg>
  );
}
