import { useInfusionCases } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { H1, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

export default function InfusionList() {
  const { t } = useApp();
  const cases = useInfusionCases();

  return (
    <Screen>
      <H1>{t("infusion.title")}</H1>
      <P muted>{t("infusion.intro")}</P>
      <RemoteGate state={cases} onRetry={cases.refresh}>
        {(data) => (
          <>
            {data.map((c) => <NavCard key={c.key} href={`/infusion/${c.key}`} title={t("infusion.question")} body={c.vignette} />)}
          </>
        )}
      </RemoteGate>
    </Screen>
  );
}
