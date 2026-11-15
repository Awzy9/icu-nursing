/** Original educational schematic: generic shapes only (no manufacturer screens, icons or alarm tables). */
import type { EquipmentModule } from "@/lib/equipment/types";

type Props = { kind: EquipmentModule["diagram"]["kind"]; labels: string[]; selected: number | null; rtl: boolean; title: string; desc: string };
const W = 480, H = 200;

export function EquipmentDiagram({ kind, labels, selected, rtl, title, desc }: Props) {
  const n = labels.length;
  const fx = (x: number) => (rtl ? W - x : x);
  const on = (i: number) => selected === i;
  const stroke = (i: number) => (on(i) ? "var(--primary, #1d4ed8)" : "currentColor");
  const id = `eqd-${kind}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t ${id}-d`} className="h-auto w-full max-w-xl text-foreground" focusable="false">
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{desc}</desc>
      {kind === "signal" ? (
        <g fill="none" strokeWidth={2.5}>
          <line x1={fx(20)} y1={150} x2={fx(460)} y2={150} stroke={stroke(n - 1)} strokeDasharray="6 4" />
          <path d={`M${fx(20)} 150 C${fx(80)} 150 ${fx(100)} 40 ${fx(150)} 40`} stroke={stroke(0)} />
          <circle cx={fx(150)} cy={40} r={7} fill={on(1) ? "var(--primary, #1d4ed8)" : "currentColor"} stroke="none" />
          <path d={`M${fx(150)} 40 C${fx(200)} 40 ${fx(220)} 150 ${fx(280)} 150`} stroke={stroke(2)} />
          <path d={`M${fx(280)} 150 C${fx(330)} 150 ${fx(350)} 40 ${fx(400)} 40 C${fx(430)} 40 ${fx(440)} 150 ${fx(460)} 150`} stroke="currentColor" opacity={0.35} />
        </g>
      ) : (
        <g>
          {labels.map((l, i) => {
            const cx = kind === "flow" ? 60 + i * ((W - 120) / Math.max(1, n - 1)) : W / 2 + 120 * Math.cos((2 * Math.PI * i) / n - Math.PI / 2);
            const cy = kind === "flow" ? H / 2 : H / 2 + 70 * Math.sin((2 * Math.PI * i) / n - Math.PI / 2);
            const nx = kind === "flow" ? 60 + (i + 1) * ((W - 120) / Math.max(1, n - 1)) : W / 2 + 120 * Math.cos((2 * Math.PI * ((i + 1) % n)) / n - Math.PI / 2);
            const ny = kind === "flow" ? H / 2 : H / 2 + 70 * Math.sin((2 * Math.PI * ((i + 1) % n)) / n - Math.PI / 2);
            return (
              <g key={i}>
                {kind === "flow" && i === n - 1 ? null : <line x1={fx(cx)} y1={cy} x2={fx(nx)} y2={ny} stroke="currentColor" strokeWidth={2} opacity={0.5} />}
                <circle cx={fx(cx)} cy={cy} r={22} fill={on(i) ? "var(--primary, #1d4ed8)" : "var(--card, #fff)"} stroke="currentColor" strokeWidth={2} />
                <text x={fx(cx)} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill={on(i) ? "#fff" : "currentColor"}>{i + 1}</text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
