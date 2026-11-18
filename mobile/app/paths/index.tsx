import { View } from "react-native";
import { computePathProgress, pathTitle } from "../../src/core/paths";
import { usePaths } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { H1, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

export default function PathsList() {
  const { t, rtl: ar, progress } = useApp();
  const paths = usePaths();

  return (
    <Screen>
      <H1>{t("paths.title")}</H1>
      <P muted>{t("paths.intro")}</P>
      <RemoteGate state={paths} onRetry={paths.refresh}>
        {(data) => (
          <View style={{ gap: 12 }}>
            {data.map((p) => {
              const result = computePathProgress(p.steps, progress);
              const label = result.completed === 0 ? t("paths.start") : result.percent === 100 ? t("paths.review") : t("paths.continue");
              return (
                <NavCard key={p.key} href={`/paths/${p.key}`} title={pathTitle(p, ar)} body={`${t("paths.complete", { n: result.completed, total: result.total })} · ${label}`} />
              );
            })}
          </View>
        )}
      </RemoteGate>
    </Screen>
  );
}
