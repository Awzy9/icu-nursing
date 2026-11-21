import { useState } from "react";
import { useRouter, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { onboardingSteps } from "../src/core/onboarding";
import { useApp } from "../src/state/app";
import { Button, Callout, Card, H1, P, Screen } from "../src/ui/components";
import { Icon, IconTile, type IconName } from "../src/ui/icons";
import { radii, space, type } from "../src/ui/theme";

const navigationPreview: readonly { icon: IconName; label: readonly [string, string]; step: number }[] = [
  { icon: "book", label: ["Learn", "تعلّم"], step: 1 },
  { icon: "checklist", label: ["Practice", "تدرّب"], step: 2 },
  { icon: "flask", label: ["Tools", "الأدوات"], step: 3 },
  { icon: "pulse", label: ["Visuals", "الصور"], step: 4 },
  { icon: "user", label: ["Account", "الحساب"], step: 5 },
];

/**
 * An optional, replayable product tour. It uses only local settings, not clinical progress
 * or account state. Skip / finish never request login or any device permissions.
 */
export default function OnboardingTutorial() {
  const router = useRouter();
  const { palette, rtl: ar, finishOnboarding } = useApp();
  const [index, setIndex] = useState(0);
  const step = onboardingSteps[index]!;
  const lang = ar ? 1 : 0;
  const last = index === onboardingSteps.length - 1;
  const navigate = (href: Href) => {
    finishOnboarding();
    router.replace(href);
  };

  return (
    <Screen banner={false} safeAreaTop>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.sm, minHeight: 44 }}>
        <Text style={[type.small, { color: palette.muted, fontWeight: "700" }]}>
          {ar ? `الخطوة ${index + 1} من ${onboardingSteps.length}` : `Step ${index + 1} of ${onboardingSteps.length}`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ar ? "تخطي الشرح" : "Skip tutorial"}
          onPress={() => navigate("/(tabs)/home")}
          style={{ minHeight: 44, minWidth: 64, alignItems: "center", justifyContent: "center", paddingHorizontal: space.sm }}
        >
          <Text style={[type.small, { color: palette.primary, fontWeight: "700" }]}>{ar ? "تخطي" : "Skip"}</Text>
        </Pressable>
      </View>

      <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: onboardingSteps.length, now: index + 1 }} accessibilityLabel={ar ? "تقدم الدليل" : "Tutorial progress"} style={{ flexDirection: "row", gap: 5, minHeight: 6 }}>
        {onboardingSteps.map((part, i) => (
          <View key={part.id} style={{ flex: 1, height: 6, borderRadius: radii.pill, backgroundColor: i <= index ? palette.primary : palette.border }} />
        ))}
      </View>

      <View style={{ minHeight: 188, backgroundColor: palette.tint, borderColor: palette.hairline, borderWidth: 1, borderRadius: radii.xl, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.md }}>
        <IconTile name={step.icon} accent={step.accent} size={74} />
        <Text style={[type.small, { color: palette.primary, fontWeight: "700", textAlign: "center" }]}>{step.eyebrow[lang]}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: space.sm }}>
          {navigationPreview.map((item) => (
            <View key={item.icon} style={{ flexDirection: "row", alignItems: "center", gap: 4, opacity: index === 0 || index === item.step ? 1 : 0.55 }}>
              <Icon name={item.icon} size={15} color={index === item.step ? palette.primary : palette.muted} />
              <Text style={[type.caption, { color: index === item.step ? palette.primary : palette.muted }]}>{item.label[lang]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <H1>{step.title[lang]}</H1>
        <P muted>{step.description[lang]}</P>
      </View>

      <Card>
        {step.points.map((item, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm }}>
            <View style={{ backgroundColor: palette.tint, borderRadius: radii.pill, width: 26, height: 26, alignItems: "center", justifyContent: "center" }}>
              <Icon name="check" color={palette.primary} size={17} />
            </View>
            <View style={{ flex: 1, paddingTop: 2 }}>
              <P>{item[lang]}</P>
            </View>
          </View>
        ))}
      </Card>

      {index === 0 || index === 3 ? (
        <Callout tone="info">{ar
          ? "هذه المنصة مخصّصة للتعلّم باستخدام محتوى قيد المراجعة، وليست بديلاً عن سياسات المستشفى أو التقييم السريري."
          : "ICU Nursing provides draft educational content, not a substitute for clinical assessment, hospital policy or supervised practice."}</Callout>
      ) : null}

      {last ? (
        <View style={{ gap: space.sm }}>
          <Button label={ar ? "ابدأ مساراً تعليمياً" : "Start a Learning Path"} icon="route" onPress={() => navigate("/paths")} />
          <Button label={ar ? "استكشف المكتبة البصرية" : "Explore Visual Library"} variant="outline" icon="pulse" onPress={() => navigate("/(tabs)/visuals")} />
          <Button label={ar ? "جرّب التدريب العملي" : "Try Practice"} variant="outline" icon="checklist" onPress={() => navigate("/(tabs)/practice")} />
          <Button label={ar ? "اذهب إلى الرئيسية" : "Go to Home"} variant="outline" onPress={() => navigate("/(tabs)/home")} />
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {index > 0 ? <View style={{ flex: 1 }}>
            <Button label={ar ? "السابق" : "Back"} variant="outline" onPress={() => setIndex((i) => Math.max(0, i - 1))} />
          </View> : null}
          <View style={{ flex: 2 }}>
            <Button label={ar ? "التالي" : "Next"} onPress={() => setIndex((i) => Math.min(onboardingSteps.length - 1, i + 1))} />
          </View>
        </View>
      )}
      <P small muted>{ar
        ? "يمكنك إعادة فتح هذا الدليل في أي وقت من الحساب."
        : "You can replay this tutorial any time from Account."}</P>
    </Screen>
  );
}
