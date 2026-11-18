import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { computePathProgress, pathAudience, pathObjective, pathTitle } from "../../src/core/paths";
import { ROUTE_FOR_TYPE } from "../../src/core/search";
import { usePaths } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { Button, Callout, H1, H2, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";
import { space } from "../../src/ui/theme";

function Bar({ percent }: { percent: number }) {
  const { palette } = useApp();
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={{ height: 8, borderRadius: 999, backgroundColor: palette.border, overflow: "hidden" }}>
      <View style={{ height: "100%", width: `${percent}%`, borderRadius: 999, backgroundColor: palette.primary }} />
    </View>
  );
}

export default function PathDetail() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t, rtl: ar, progress } = useApp();
  const router = useRouter();
  const paths = usePaths();

  return (
    <Screen>
      <RemoteGate state={paths} onRetry={paths.refresh}>
        {(data) => {
          const path = data.find((p) => p.key === key);
          if (!path) return <P>{t("common.notFound")}</P>;
          const prereq = path.prerequisite ? data.find((p) => p.key === path.prerequisite) : undefined;
          const result = computePathProgress(path.steps, progress);

          return (
            <>
              <H1>{pathTitle(path, ar)}</H1>
              <P muted>{pathAudience(path, ar)}</P>
              <P small muted>{t("paths.minutes", { minutes: path.estimatedMinutes })}</P>
              {prereq ? <NavCard href={`/paths/${prereq.key}`} title={t("paths.prereq", { title: pathTitle(prereq, ar) })} /> : null}

              <H2>{t("paths.objectives")}</H2>
              <View style={{ gap: 4 }}>{path.objectives.map((o, i) => <P key={i} small>{`• ${pathObjective(o, ar)}`}</P>)}</View>

              <H2>{t("paths.yourProgress")}</H2>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <P small muted>{t("paths.complete", { n: result.completed, total: result.total })}</P>
                <P small muted>{`${result.percent}%`}</P>
              </View>
              <Bar percent={result.percent} />
              {result.percent === 100 ? (
                <Callout tone="success">{t("paths.doneTitle")}{"\n"}{t("paths.doneBody")}</Callout>
              ) : result.nextStep ? (
                <NavCard href={`${ROUTE_FOR_TYPE[result.nextStep.step.type]}${result.nextStep.step.key}`} title={result.completed === 0 ? t("paths.startHere") : t("paths.continueFrom")} body={result.nextStep.step.title} />
              ) : null}

              <H2>{t("paths.stepsTitle")}</H2>
              <View style={{ gap: space.sm }}>
                {result.steps.map((s, i) => {
                  const route = ROUTE_FOR_TYPE[s.step.type];
                  const body = `${t(`type.${s.step.type}`)} · ${s.done ? t("paths.stepDone") : t("paths.stepNotDone")}`;
                  return route ? (
                    <NavCard key={s.step.key} href={`${route}${s.step.key}`} title={`${i + 1}. ${s.step.title}`} body={body} />
                  ) : (
                    <P key={s.step.key}>{`${i + 1}. ${s.step.title}`}</P>
                  );
                })}
              </View>

              <P small muted>{t("paths.disclaimer")}</P>
              <Button label={t("paths.allPaths")} variant="outline" onPress={() => router.push("/paths")} />
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
