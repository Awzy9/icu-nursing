import { useState } from "react";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { useAccess } from "../../src/auth/useAccess";
import { useCatalogList } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { Callout, Chip, H1, H2, NavCard, P, Screen, SectionLabel } from "../../src/ui/components";
import { ModuleVisuals } from "../../src/ui/module-visuals";
import { ChestLandmarkDiagram } from "../../src/ui/chest-landmark-diagram";
import { RealImageLearning } from "../../src/ui/real-image-learning";
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
  const router = useRouter();
  const access = useAccess();
  const equipmentList = useCatalogList("equipment");
  const skillsList = useCatalogList("skills");
  const keysOf = (l: { status: string; data?: { key: string }[] }) => (l.status === "ready" && l.data ? l.data.map((e) => e.key) : undefined);
  // The picker follows the same first-three rule as the library lists, so a free device always opens its lesson.
  const equipmentLocked = (key: string) => access.lockedKey(keysOf(equipmentList as never), key);
  const skillLocked = (key: string) => access.lockedKey(keysOf(skillsList as never), key);
  const toGate = () => router.push(`/account-required?next=${encodeURIComponent("/visuals")}`);
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
            {EQUIPMENT.map((item) => <Chip key={item.key} label={item.name[ar ? 1 : 0] + (equipmentLocked(item.key) ? " 🔒" : "")} selected={equipment === item.key} onPress={() => (equipmentLocked(item.key) ? toGate() : setEquipment(item.key))} />)}
          </View>
          {equipment === "EQ-06" ? <RealImageLearning kind="crrt-machine" /> : null}
          <ModuleVisuals moduleKey={equipment} />
          <NavCard href={`/equipment/${equipment}`} title={label("Read the equipment lesson", "اقرأ درس الجهاز")} icon="book" accent="equipment" />
          {equipment === "EQ-04" ? <NavCard href="/infusion-calculator" title={label("Open infusion calculator", "افتح حاسبة التسريب")} icon="pill" accent="medications" /> : null}
          {equipment === "EQ-06" ? <NavCard href="/crrt" title={label("Explore CRRT circuit", "استكشف دائرة العلاج الكلوي")} icon="flask" accent="equipment" /> : null}
          {equipment === "EQ-02" ? <NavCard href="/waveform-compare" title={label("Compare ventilator traces", "قارن موجات التنفس")} icon="pulse" accent="equipment" /> : null}
        </>
      ) : null}

      {section === "imaging" ? (
        <>
          <RealImageLearning kind="chest-xray" />
          <ChestLandmarkDiagram />
          <H2>{label("Real-image learning examples", "أمثلة تصوير حقيقية للتعلم")}</H2>
          <P muted>{label("Compare the real chest radiograph with the anatomy diagram above. A separate, attributed bladder ultrasound example follows.", "قارن أشعة الصدر الحقيقية بالرسم التشريحي أعلاه. ويليها مثال مستقل لصورة الموجات فوق الصوتية للمثانة مع ذكر مصدرها.")}</P>
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
            {SKILLS.map((item) => <Chip key={item.key} label={item.name[ar ? 1 : 0] + (skillLocked(item.key) ? " 🔒" : "")} selected={skill === item.key} onPress={() => (skillLocked(item.key) ? toGate() : setSkill(item.key))} />)}
          </View>
          <ModuleVisuals moduleKey={skill} />
          <NavCard href={`/skills/${skill}`} title={label("Read the illustrated skill", "اقرأ المهارة المصورة")} icon="book" accent="skills" />
          <NavCard href={`/step-order/${skill}`} title={label("Practise ordering the steps", "تدرّب على ترتيب الخطوات")} body={label("Check your sequence with the lesson checklist", "تحقق من الترتيب باستخدام قائمة الدرس")} icon="checklist" accent="skills" />
        </>
      ) : null}
    </Screen>
  );
}
