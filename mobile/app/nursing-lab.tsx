import { useState } from "react";
import { Linking } from "react-native";
import { activities, expiratoryFlowExamples } from "../../src/lib/working/nursing-lab";
import { Button, Card, H1, H2, NavCard, P, Screen } from "../src/ui/components";
import { EquipmentImages } from "../src/ui/equipment-images";
import { WaveformChart } from "../src/ui/waveform-chart";

export default function NursingLab() {
  const [activityIndex, setActivityIndex] = useState<number>();
  const [position, setPosition] = useState(0);
  const [choice, setChoice] = useState<number>();
  const activity = activityIndex === undefined ? undefined : activities[activityIndex];
  const step = activity?.steps[position];
  const source = activity && "source" in activity ? activity.source : undefined;

  return (
    <Screen>
      <H1>Nursing lab</H1>
      {activity ? <>
        <Button label="All activities" variant="outline" onPress={() => setActivityIndex(undefined)} />
        <H2>{activity.title}</H2>
        {step ? <>
          {"equipment" in step && <EquipmentImages moduleKey={step.equipment} forQuestion />}
          <P>{step.prompt}</P>
          {"monitor" in step && step.monitor?.map(({ patient, readings }) => <Card key={patient}>
            <H2>{patient}</H2>
            {readings.map(([label, value]) => <P key={label}>{label} · {value}</P>)}
          </Card>)}
          {"readouts" in step && step.readouts?.map(([label, value]) => <P key={label}>{label} · {value}</P>)}
          {"flowComparison" in step && step.flowComparison && expiratoryFlowExamples.map((trace) =>
            <WaveformChart key={trace.label} trace={trace} />)}
          {step.choices.map((label, index) => <Button key={label} label={label}
            variant={choice === index ? "primary" : "outline"} disabled={choice !== undefined} onPress={() => setChoice(index)} />)}
          {choice !== undefined && <>
            <P>{choice === step.answer ? "Correct. " : "Review the feedback. "}{step.why}</P>
            <Button label={position + 1 === activity.steps.length ? "Finish activity" : "Next step"}
              onPress={() => { setPosition(position + 1); setChoice(undefined); }} />
          </>}
        </> : <P>Activity complete.</P>}
        {source && <Button label={source.label} variant="outline" onPress={() => { void Linking.openURL(source.href).catch(() => undefined); }} />}
      </> : <>
        {activities.map((item, index) => <Card key={item.id}>
          <H2>{item.title}</H2><P muted>{item.intro}</P>
          <Button label="Start activity" onPress={() => { setPosition(0); setChoice(undefined); setActivityIndex(index); }} />
        </Card>)}
        <NavCard href="/paths" title="Orientation and learning paths" />
        <NavCard href="/study" title="Review and revision" />
      </>}
    </Screen>
  );
}
