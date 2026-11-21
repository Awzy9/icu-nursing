import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { View } from "react-native";
import { useApp } from "../state/app";
import { P } from "./components";
import { space } from "./theme";

const ON = "#22d3ee";
const DEFAULT = "#94a3b8";
/** Simplified pathway map: not intended to depict a particular CRRT machine, prescription or connection. */
export function CrrtCircuitDiagram({ active }: { active?: string | null }) {
  const { rtl: ar } = useApp();
  const mark = (key: string) => active === key ? ON : DEFAULT;
  return (
    <View style={{ gap: space.sm }}>
      <P small muted>{ar ? "مخطط تعليمي مبسّط: المسارات تختلف بين الأجهزة وأنماط العلاج." : "Simplified educational circuit — pathways differ across CRRT modes and manufacturers. Select a component below to learn its function."}</P>
      <View accessibilityRole="image" accessibilityLabel="Simplified continuous renal replacement therapy circuit with access, blood pump, filter, return, dialysate, replacement fluid and effluent" style={{ backgroundColor: "#091522", padding: space.sm, borderRadius: 14 }}>
        <Svg width="100%" height={262} viewBox="0 0 340 270">
          <Rect x={7} y={97} width={70} height={68} rx={11} fill="#172b43" stroke={mark("access")} strokeWidth={2}/>
          <SvgText x={42} y={123} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#fff">Patient</SvgText>
          <SvgText x={42} y={142} textAnchor="middle" fontSize={10} fill="#cbd5e1">access / return</SvgText>
          <Rect x={113} y={50} width={73} height={52} rx={12} fill="#172b43" stroke={mark("blood-pump")} strokeWidth={2}/>
          <SvgText x={149} y={71} textAnchor="middle" fontSize={11} fill="#fff">Blood</SvgText>
          <SvgText x={149} y={86} textAnchor="middle" fontSize={11} fill="#fff">pump</SvgText>
          <Rect x={236} y={50} width={90} height={95} rx={12} fill="#172b43" stroke={mark("filter")} strokeWidth={2}/>
          <SvgText x={280} y={91} textAnchor="middle" fontSize={12} fill="#fff">Filter</SvgText>
          <Path d="M77 112L96 112V76h17 M186 76h50" stroke="#f59e92" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M236 126h-47v60H78v-40" stroke={mark("return")} strokeWidth={5} fill="none" strokeLinecap="round"/>
          <SvgText x={101} y={58} fontSize={10} fill="#fca5a5">Blood out</SvgText>
          <SvgText x={117} y={206} fontSize={10} fill="#d1fae5">Blood back</SvgText>
          <Rect x={220} y={181} width={108} height={44} rx={9} fill="#172b43" stroke={mark("effluent")} strokeWidth={2}/>
          <SvgText x={274} y={207} fontSize={11} textAnchor="middle" fill="#fff">Effluent</SvgText>
          <Path d="M280 145v36" stroke={mark("effluent")} strokeWidth={4}/>
          <Rect x={179} y={4} width={98} height={31} rx={9} fill="#172b43" stroke={mark("dialysate")} strokeWidth={2}/>
          <SvgText x={228} y={24} textAnchor="middle" fontSize={11} fill="#fff">Dialysate</SvgText>
          <Path d="M270 35v15" stroke={mark("dialysate")} strokeWidth={3} />
          <Rect x={13} y={4} width={94} height={31} rx={9} fill="#172b43" stroke={mark("replacement")} strokeWidth={2}/>
          <SvgText x={60} y={24} textAnchor="middle" fontSize={11} fill="#fff">Replacement*</SvgText>
          <Path d="M60 35v8H212v33" stroke={mark("replacement")} strokeDasharray="4 4" strokeWidth={3} fill="none"/>
          <Circle cx={199} cy={76} r={7} stroke={mark("pressures")} strokeWidth={2} fill="#172b43"/>
          <Circle cx={199} cy={186} r={7} stroke={mark("pressures")} strokeWidth={2} fill="#172b43"/>
          <Line x1={13} y1={245} x2={55} y2={245} stroke="#f59e92" strokeWidth={4}/>
          <SvgText x={61} y={249} fontSize={10} fill="#cbd5e1">Blood path</SvgText>
          <Line x1={194} y1={245} x2={236} y2={245} stroke="#7dd3fc" strokeWidth={4}/>
          <SvgText x={241} y={249} fontSize={10} fill="#cbd5e1">Fluid path</SvgText>
        </Svg>
      </View>
      <P small muted>{ar ? "* يمكن أن تكون سوائل الاستبدال قبل الفلتر أو بعده حسب نمط العلاج. يتبع الرسم التوضيحي المبادئ العامة فقط." : "* Replacement fluid may enter before or after the filter, depending on the mode. The drawing is schematic, not a procedure guide."}</P>
    </View>
  );
}
