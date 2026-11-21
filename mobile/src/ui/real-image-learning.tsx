import { useState } from "react";
import { Image, Linking, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useApp } from "../state/app";
import { Button, Callout, P } from "./components";
import { radii, space, type } from "./theme";

type Pair = readonly [string, string];
export type RealImageKind = "chest-xray" | "crrt-machine";

interface Checkpoint {
  question: Pair;
  answer: Pair;
}
interface StudyImage {
  uri: string;
  sourceUrl: string;
  licenseUrl: string;
  license: string;
  credit: string;
  aspectRatio: number;
  title: Pair;
  alt: Pair;
  note: Pair;
  checkpoints: readonly Checkpoint[];
}

/** Unaltered, publicly licensed clinical imagery; images are fetched on demand, never simulated. */
export const REAL_STUDIES: Record<RealImageKind, StudyImage> = {
  "chest-xray": {
    uri: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    license: "CC0 1.0",
    credit: "Mikael Häggström / Wikimedia Commons",
    aspectRatio: 1929 / 2207,
    title: ["Real chest X-ray — normal PA example", "صورة أشعة صدر حقيقية — مثال طبيعي بوضعية PA"],
    alt: ["Actual unannotated posteroanterior adult chest radiograph, showing both lungs, mediastinum, heart shadow, diaphragms and costophrenic angles.", "صورة أشعة صدر حقيقية أمامية خلفية للبالغين تُظهر الرئتين والمنصف وظل القلب والحجاب الحاجز والزوايا الضلعية الحجابية."],
    note: ["This published image was described by its creator as showing no signs of injury. It is a single teaching example, not a diagnostic reference for all patients; compare with the anatomy diagram below.", "وصف صاحب الصورة هذه الأشعة المنشورة بأنها دون علامات إصابة. وهي مثال تعليمي واحد لا مرجع تشخيصي لجميع المرضى؛ قارنها بالرسم التشريحي أدناه."],
    checkpoints: [
      {
        question: ["How do you orient this image?", "كيف تحدد اتجاه الصورة؟"],
        answer: ["It is a PA view. Check the right/left markers and projection before interpreting any anatomy. The patient's right appears on the viewer's left.", "هذه صورة بوضعية PA. تحقق من علامتي اليمين واليسار ونوع الإسقاط قبل تفسير التشريح. يظهر يمين المريض على يسار المشاهد."],
      },
      {
        question: ["Where should you inspect the airway?", "أين تفحص مجرى الهواء؟"],
        answer: ["Trace the tracheal air column toward the carina and compare it with the midline. Rotation and positioning can change the apparent alignment.", "تتبع عمود الهواء في الرغامى نحو تفرعها وقارن مساره مع الخط المتوسط. قد تؤثر وضعية المريض أو دوران الصورة في المحاذاة الظاهرة."],
      },
      {
        question: ["What is your lung and pleural survey?", "كيف تفحص الرئتين والجنبة؟"],
        answer: ["Compare both lung fields from apices to bases for asymmetry, focal opacities and pleural lines; then inspect both costophrenic angles. A normal example does not exclude every disease.", "قارن حقلي الرئتين من القمم إلى القواعد بحثاً عن عدم التماثل أو العتامات الموضعية أو الخطوط الجنبية، ثم افحص الزاويتين الضلعيتين الحجابيتين. لا تستبعد الصورة الطبيعية كل الأمراض."],
      },
      {
        question: ["Which additional structures matter?", "ما البنى الأخرى التي يجب مراجعتها؟"],
        answer: ["Review the cardiac silhouette, diaphragms, mediastinum, ribs and visible soft tissues. Use a systematic review and correlate findings with the patient and formal report.", "راجع ظل القلب والحجاب الحاجز والمنصف والأضلاع والأنسجة الرخوة المرئية. اتبع مراجعة منهجية واربط الملاحظات بحالة المريض والتقرير المعتمد."],
      },
    ],
  },
  "crrt-machine": {
    uri: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Haemofilter.png",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Haemofilter.png",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    license: "CC BY-SA 3.0",
    credit: "Jfdwolff / Wikimedia Commons",
    aspectRatio: 368 / 640,
    title: ["Real haemofiltration machine — equipment photo", "صورة حقيقية لجهاز ترشيح الدم"],
    alt: ["Real front-facing photograph of a haemofiltration machine, with display housing, pumps, filter cartridge and tubing visible.", "صورة حقيقية لواجهة جهاز ترشيح الدم تظهر هيكل الشاشة والمضخات وخرطوشة المرشح والأنابيب."],
    note: ["This is an older haemofiltration machine, not a diagram or a model-specific CRRT setup guide. The location, colours and connections of pumps, filters and fluid bags vary by device and treatment mode.", "هذه صورة لجهاز ترشيح دم أقدم، وليست رسماً أو دليلاً لتجهيز جهاز CRRT محدد. تختلف أماكن وألوان وتوصيلات المضخات والمرشحات وأكياس السوائل حسب الجهاز وطريقة العلاج."],
    checkpoints: [
      {
        question: ["What does the machine monitor?", "ما الذي يراقبه الجهاز؟"],
        answer: ["The console monitors the extracorporeal treatment and relevant pressures, flows and alarms. Display details depend on the machine and selected therapy.", "تراقب وحدة التحكم العلاج خارج الجسم والضغوط والتدفقات والتنبيهات ذات الصلة. وتختلف التفاصيل حسب الجهاز ونمط العلاج المختار."],
      },
      {
        question: ["What is the filter's role?", "ما وظيفة المرشح؟"],
        answer: ["The haemofilter contains a semipermeable membrane for solute and fluid transfer. The mechanism varies with haemofiltration, haemodialysis or haemodiafiltration.", "يحتوي مرشح الدم على غشاء شبه منفذ لانتقال المذابات والسوائل. وتختلف الآلية بين الترشيح الدموي والغسيل الدموي والترشيح والغسيل المشترك."],
      },
      {
        question: ["Which paths need to be distinguished?", "ما المسارات التي يجب تمييزها؟"],
        answer: ["Identify access (blood entering the circuit), return (blood returning to the patient), and effluent paths. Dialysate and replacement-fluid pathways depend on the prescribed mode; do not infer line identity from colour alone.", "ميّز خط سحب الدم إلى الدارة وخط إعادته إلى المريض ومسار سائل الطرح. تعتمد مسارات سائل الغسيل والتعويض على نمط العلاج الموصوف، ولا تعتمد على اللون وحده لتحديد الخط."],
      },
      {
        question: ["What is the bedside safety priority?", "ما أولوية السلامة بجانب السرير؟"],
        answer: ["Follow the specific device's instructions and local CRRT policy. Check vascular access, alarms, fluid balance and prescribed settings with the trained team; never configure treatment from this photo.", "اتبع تعليمات الجهاز المحدد وسياسة المستشفى. راجع الوصول الوعائي والتنبيهات وتوازن السوائل والإعدادات الموصوفة مع الفريق المدرّب، ولا تضبط العلاج اعتماداً على هذه الصورة."],
      },
    ],
  },
};

export function RealImageLearning({ kind }: { kind: RealImageKind }) {
  const { rtl, palette } = useApp();
  const lang = rtl ? 1 : 0;
  const study = REAL_STUDIES[kind];
  const { width: screenWidth } = useWindowDimensions();
  const imageWidth = Math.max(160, Math.min(screenWidth - 72, 430));
  const [active, setActive] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);

  return (
    <View style={{ backgroundColor: palette.surface, borderColor: palette.hairline, borderWidth: 1, borderRadius: radii.lg, overflow: "hidden", gap: space.md, padding: space.md }}>
      <Text accessibilityRole="header" style={[type.h3, { color: palette.text, writingDirection: rtl ? "rtl" : "ltr" }]}>{study.title[lang]}</Text>
      {failed ? (
        <View style={{ backgroundColor: palette.tint, padding: space.md, gap: space.sm, borderRadius: radii.md }}>
          <P>{rtl ? "لا يمكن تحميل الصورة الآن. يتطلب عرض الصور الحقيقية اتصالاً بالإنترنت." : "The real photo could not load. This resource requires an internet connection."}</P>
          <Button variant="outline" label={rtl ? "إعادة المحاولة" : "Retry image"} onPress={() => { setFailed(false); setRevision((n) => n + 1); }} />
        </View>
      ) : (
        <Image key={revision} source={{ uri: study.uri, cache: "force-cache" }} resizeMode="contain" onError={() => setFailed(true)} accessibilityLabel={study.alt[lang]} style={{ width: imageWidth, aspectRatio: study.aspectRatio, alignSelf: "center", backgroundColor: "#121820" }} />
      )}
      <P muted small>{study.note[lang]}</P>
      <View style={{ gap: space.xs }}>
        <Pressable accessibilityRole="link" accessibilityLabel={rtl ? "افتح الصورة الأصلية ومعلومات ترخيصها" : "Open original image and source attribution"} onPress={() => void Linking.openURL(study.sourceUrl)}>
          <Text style={[type.small, { color: palette.primary, fontWeight: "700" }]}>{rtl ? "المصدر والصورة الأصلية" : "Original image and source"} · {study.credit}</Text>
        </Pressable>
        <Pressable accessibilityRole="link" accessibilityLabel={rtl ? "تفاصيل رخصة الصورة" : "Image license details"} onPress={() => void Linking.openURL(study.licenseUrl)}>
          <Text style={[type.small, { color: palette.muted }]}>{study.license} · {rtl ? "دون تعديل" : "Unmodified image"}</Text>
        </Pressable>
      </View>
      <Text style={[type.h3, { color: palette.text, writingDirection: rtl ? "rtl" : "ltr" }]}>{rtl ? "تعلّم من الصورة — اضغط على سؤال للكشف عن الشرح" : "Study the image — tap a question to reveal the explanation"}</Text>
      {study.checkpoints.map((checkpoint, i) => (
        <View key={i} style={{ gap: space.xs }}>
          <Button variant="outline" label={checkpoint.question[lang] + (active === i ? " −" : " +")} onPress={() => setActive((current) => current === i ? null : i)} />
          {active === i ? <View style={{ backgroundColor: palette.tint, padding: space.md, borderRadius: radii.md }}><P small>{checkpoint.answer[lang]}</P></View> : null}
        </View>
      ))}
      <Callout tone="info">{rtl ? "للتعلم فقط؛ ليست صورة لمريضك ولا بديلاً عن التفسير السريري أو دليل الجهاز." : "Educational reference only. Not patient-specific imaging, a clinical interpretation or device operating instructions."}</Callout>
    </View>
  );
}
