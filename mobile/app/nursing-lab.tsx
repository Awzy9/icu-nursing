import { useState } from "react";
import { Stack } from "expo-router";
import { View } from "react-native";
import { activities, expiratoryFlowExamples, orientation } from "../src/content/nursing-lab";
import { useApp } from "../src/state/app";
import { useProgressSync } from "../src/hooks/useProgressSync";
import { Button, Callout, Card, H1, H2, NavCard, P, Screen } from "../src/ui/components";
import { ModuleVisuals } from "../src/ui/module-visuals";
import { WaveformChart } from "../src/ui/waveform-chart";
import { space } from "../src/ui/theme";

type Activity = (typeof activities)[number];
type Workspace = "shift" | "medication-checks" | "visual-skills" | "orientation" | "mistakes";
function attemptId(activityId: string, index: number): string {
  return `LAB-${activityId.toUpperCase().replace(/[^A-Z0-9]/g, "-")}-${index + 1}`;
}
const lessonRoute = (lesson: string) =>
  lesson.startsWith("EQ-") ? `/equipment/${lesson}` : lesson.startsWith("SK-") ? `/skills/${lesson}` : `/topics/${lesson}`;

function ActivityRunner({ activity, start = 0, single = false }: { activity: Activity; start?: number; single?: boolean }) {
  const { progress } = useApp();
  const { recordAnswer } = useProgressSync();
  const [index, setIndex] = useState(start);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const step = activity.steps[index];
  if (finished || !step) return (
    <Card>
      <H2>{single ? "Decision reviewed" : "Activity completed"}</H2>
      <P>{single ? "Return to Review mistakes to repeat other missed decisions." : `${score} / ${activity.steps.length} correct on this run.`}</P>
      <Button label="Try again" variant="outline" onPress={() => { setIndex(start); setChoice(null); setChecked(false); setScore(0); setFinished(false); }} />
    </Card>
  );
  const check = () => {
    if (choice === null || checked) return;
    const correct = choice === step.answer;
    recordAnswer(attemptId(activity.id, index), "NURSING-LAB", choice, correct, Date.now());
    if (correct) setScore((n) => n + 1);
    setChecked(true);
  };
  const next = () => {
    if (single || index + 1 >= activity.steps.length) setFinished(true);
    else { setIndex((n) => n + 1); setChoice(null); setChecked(false); }
  };
  return (
    <View style={{ gap: space.md }}>
      <P small muted>{`${index + 1} / ${activity.steps.length} · Fictional training scenario`}</P>
      {"monitor" in step && step.monitor ? step.monitor.map((monitor) => (
        <Card key={monitor.patient}>
          <H2>{monitor.patient}</H2>
          {monitor.readings.map(([label, value]) => <P key={label}>{label}: {value}</P>)}
        </Card>
      )) : null}
      {"readouts" in step && step.readouts ? (
        <Card>
          <H2>Compare the order, label and display</H2>
          {step.readouts.map(([label, value]) => <P key={label}>{label}: {value}</P>)}
        </Card>
      ) : null}
      {"equipment" in step && step.equipment ? <ModuleVisuals moduleKey={step.equipment} /> : null}
      {"flowComparison" in step && step.flowComparison ? (
        <Card>
          <P small muted>Compare expiratory flow against the zero-flow line.</P>
          {expiratoryFlowExamples.map((trace) => <WaveformChart key={trace.label} trace={trace} />)}
        </Card>
      ) : null}
      <H2>{step.prompt}</H2>
      {step.choices.map((option, i) => (
        <Button key={i} label={option} variant={choice === i ? "primary" : "outline"} disabled={checked} onPress={() => setChoice(i)} />
      ))}
      {checked ? <Callout tone={choice === step.answer ? "success" : "warn"}>{choice === step.answer ? "Correct." : `Correct choice: ${step.choices[step.answer]}`} {step.why}</Callout> : null}
      <Button label={checked ? (single || index + 1 === activity.steps.length ? "Finish" : "Next decision") : "Check answer"} disabled={!checked && choice === null} onPress={checked ? next : check} />
    </View>
  );
}

export default function NursingLabScreen() {
  const { locale, progress } = useApp();
  const ar = locale === "ar";
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [review, setReview] = useState<{ activityId: string; index: number } | null>(null);
  const [revision, setRevision] = useState(0);
  const missed = activities.flatMap((activity) =>
    activity.steps.flatMap((step, index) => progress.attempts[attemptId(activity.id, index)]?.correct === false
      ? [{ activity, index, title: step.prompt }] : [])
  );
  const selected = activities.find((activity) => activity.id === workspace);
  const open = (key: Workspace) => { setWorkspace(key); setReview(null); setRevision((n) => n + 1); };
  return (
    <Screen>
      <Stack.Screen options={{ title: ar ? "مختبر التمريض" : "Nursing Lab" }} />
      <H1>{ar ? "مختبر التمريض التفاعلي" : "Interactive Nursing Lab"}</H1>
      <P muted>{ar ? "تدرّب على القرارات السريرية الافتراضية، وقراءة الأجهزة، ومراجعة الأخطاء." : "Practise fictional bedside decisions, read clinical equipment and review missed answers."}</P>
      <Callout tone="info">{ar ? "للتعليم فقط. لا يمثل اعتماداً للممارسة السريرية." : "Educational scenarios only; they do not certify clinical competence."}</Callout>
      {workspace ? <Button label={ar ? "كل الأنشطة" : "All activities"} variant="outline" onPress={() => { setWorkspace(null); setReview(null); }} /> : null}
      {!workspace ? (
        <View style={{ gap: space.sm }}>
          {activities.map((activity) => (
            <Button key={activity.id} label={activity.title} variant="outline" onPress={() => open(activity.id)} />
          ))}
          <Button label={ar ? "مسار التهيئة" : "Orientation path"} variant="outline" onPress={() => open("orientation")} />
          <Button label={ar ? "مراجعة الأخطاء" : `Review mistakes (${missed.length})`} variant="outline" onPress={() => open("mistakes")} />
        </View>
      ) : null}
      {selected ? (
        <>
          <H2>{selected.title}</H2>
          <P muted>{selected.intro}</P>
          <ActivityRunner key={`${selected.id}-${review?.index ?? "all"}-${revision}`} activity={selected} start={review?.activityId === selected.id ? review.index : 0} single={review?.activityId === selected.id} />
        </>
      ) : null}
      {workspace === "orientation" ? (
        <>
          <H2>{ar ? "ابدأ من هنا" : "Four guided bedside skills"}</H2>
          {orientation.map((item) => (
            <Card key={item.lesson}>
              <H2>{item.title}</H2>
              <NavCard title="Read lesson" href={lessonRoute(item.lesson)} icon="book" accent="topics" />
              {item.practice.startsWith("#") ? (
                <Button label="Try related practice" variant="outline" onPress={() => open(item.practice.slice(1) as Workspace)} />
              ) : (
                <NavCard title="Open interactive lab" href={item.practice} icon="pulse" accent="equipment" />
              )}
            </Card>
          ))}
        </>
      ) : null}
      {workspace === "mistakes" ? (
        <>
          <H2>{ar ? "القرارات التي تحتاج مراجعة" : "Decisions to review"}</H2>
          {!missed.length ? <P muted>{ar ? "لا توجد أخطاء مسجلة في هذه الأنشطة بعد." : "No missed decisions recorded in the mobile Nursing Lab yet."}</P> : missed.map((item) => (
            <Button key={attemptId(item.activity.id, item.index)} variant="outline" label={item.title} onPress={() => {
              setWorkspace(item.activity.id);
              setReview({ activityId: item.activity.id, index: item.index });
              setRevision((n) => n + 1);
            }} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
