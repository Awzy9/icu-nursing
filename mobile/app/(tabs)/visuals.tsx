import { useState } from "react";
import { View } from "react-native";
import { useApp } from "../../src/state/app";
import { Callout, Chip, H1, H2, NavCard, P, Screen, SectionLabel } from "../../src/ui/components";
import { ModuleVisuals } from "../../src/ui/module-visuals";
import { ChestLandmarkDiagram } from "../../src/ui/chest-landmark-diagram";
import { space } from "../../src/ui/theme";

type Section = "equipment" | "imaging" | "waveforms" | "skills";
const EQUIPMENT = [
  { key: "EQ-02", name: ["Ventilator", "جهاز التنفس"] },
  { key: "EQ-03", name: ["Arterial line", "الخط الشرياني"] },
  { key: "EQ-04", name: ["Infusion pump", "مضخة التسريب"] },
  { key: "EQ-05", name: ["Defibrillator", "جهاز إزالة الرجفان"] },
  { key: "EQ-06", name: ["CRRT", "العلاج الكلوي المستمر"] },
] as const;
const SKILLS = [
  { key: "SK-02", name: ["Central line", "القسطرة الوريدية المركزية"] },
  { key: "SK-04", name: ["Airway tube", "أنبوب مجرى الهواء"] },
  { key: "SK-05", name: ["Tracheostomy", "فغر الرغامى"] },
  { key: "SK-22", name: ["Syringe pump check", "فحص مضخة الحقنة"] },
] as const;
const PANELS: { id: Section; title: [string, string] }[] = [
  { id: "equipment", title: ["Equipment", "الأجهزة"] },
  { id: "imaging", title: ["Imaging", "التصوير"] },
  { id: "waveforms", title: ["Waveforms", "الموجات"] },
  { id: "skills", title: ["Nursing skills", "المهارات"] },
];

/**
 * Curated, on-demand gallery: display one equipment/skill at a time to avoid dozens of
 * full-size network images mounting at once. All external photos retain attribution.
 */
export default function VisualLibrary() {
  const { rtl: ar } = useApp();
  const [section, setSection] = useState<Section>("equipment");
  const [equipment, setEquipment] = useState<string>("EQ-02");
  const [skill, setSkill] = useState<string>("SK-02");
  const label = (en: string, arabic: string) => ar ? arabic : en;
  return (
    <Screen>
      <H1>{label("Visual Library", "مكتبة التعلم البصري")}</H1>
      <P muted>{label("Understand devices, waveforms and anatomy through illustrated learning.", "تعرّف على الأجهزة والموجات والمعالم التشريحية بالصور والرسوم التعليمية.")}</P>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {PANELS.map((item) => <Chip key={item.id} label={item.title[ar ? 1 : 0]} selected={section === item.id} onPress={() => setSection(item.id)} />)}
      </View>

      {section === "equipment" ? (
        <>
          <H2>{label("Explore one device", "اختر جهازاً")}</H2>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {EQUIPMENT.map((item) => <Chip key={item.key} label={item.name[ar ? 1 : 0]} selected={equipment === item.key} onPress={() => setEquipment(item.key)} />)}
          </View>
          <ModuleVisuals moduleKey={equipment} />
          <NavCard href={`/equipment/${equipment}`} title={label("Read the equipment lesson", "اقرأ درس الجهاز")} icon="book" accent="equipment" />
          {equipment === "EQ-04" ? <NavCard href="/infusion-calculator" title={label("Open infusion calculator", "افتح حاسبة التسريب")} icon="pill" accent="medications" /> : null}
          {equipment === "EQ-06" ? <NavCard href="/crrt" title={label("Explore CRRT circuit", "استكشف دائرة العلاج الكلوي")} icon="flask" accent="equipment" /> : null}
          {equipment === "EQ-02" ? <NavCard href="/waveform-compare" title={label("Compare ventilator traces", "قارن موجات التنفس")} icon="pulse" accent="equipment" /> : null}
        </>
      ) : null}

      {section === "imaging" ? (
        <>
          <ChestLandmarkDiagram />
          <H2>{label("Real-image learning examples", "أمثلة تصوير حقيقية للتعلم")}</H2>
          <P muted>{label("The existing website image catalogue includes a credited bladder ultrasound example. It is presented separately from the original chest anatomy schematic.", "تتضمن صور الموقع صورة موجات فوق صوتية للمثانة مع ذكر المصدر. وتُعرض منفصلة عن الرسم التخطيطي الأصلي للصدر.")}</P>
          <ModuleVisuals moduleKey="D04-T03" />
          <NavCard href="/topics/D04-T03" title={label("Read the associated clinical topic", "اقرأ الموضوع السريري المرتبط")} icon="book" accent="topics" />
          <Callout tone="info">{label("Educational imaging does not establish a diagnosis. Use actual patient imaging and clinical interpretation in practice.", "الصور التعليمية لا تثبت التشخيص. تُستخدم صور المريض الفعلية والتفسير السريري في الممارسة.")}</Callout>
        </>
      ) : null}

      {section === "waveforms" ? (
        <>
          <H2>{label("Advanced interpretation", "تفسير متقدم للموجات")}</H2>
          <NavCard href="/waveform-compare" title={label("Compare pressure, flow and volume", "مقارنة الضغط والتدفق والحجم")}
            body={label("Same time and amplitude axes, then reveal the interpretation", "المقياس الزمني والسعة نفسه، ثم اكشف التفسير")} icon="pulse" accent="equipment" />
          <NavCard href="/ecg" title={label("ECG rhythm strips", "شرائط نظم القلب")} icon="heart" accent="practice" />
          <NavCard href="/aline" title={label("Arterial-line damping", "تخميد الخط الشرياني")} icon="pulse" accent="equipment" />
          <NavCard href="/defib" title={label("Defibrillator rhythm practice", "تدريب نظم جهاز إزالة الرجفان")} icon="heart" accent="practice" />
        </>
      ) : null}

      {section === "skills" ? (
        <>
          <H2>{label("See the equipment, then practise the sequence", "شاهد الأداة ثم تدرّب على ترتيب الخطوات")}</H2>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {SKILLS.map((item) => <Chip key={item.key} label={item.name[ar ? 1 : 0]} selected={skill === item.key} onPress={() => setSkill(item.key)} />)}
          </View>
          <ModuleVisuals moduleKey={skill} />
          <NavCard href={`/skills/${skill}`} title={label("Read the illustrated skill", "اقرأ المهارة المصورة")} icon="book" accent="skills" />
          <NavCard href={`/step-order/${skill}`} title={label("Practise ordering the steps", "تدرّب على ترتيب الخطوات")} body={label("Check your sequence with the lesson checklist", "تحقق من الترتيب باستخدام قائمة الدرس")} icon="checklist" accent="skills" />
        </>
      ) : null}
    </Screen>
  );
}
