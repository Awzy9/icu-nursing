import { useAbgCases } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { H1, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

export default function AbgList() {
  const { t, rtl: ar } = useApp();
  const cases = useAbgCases();

  return (
    <Screen>
      <H1>{t("abg.title")}</H1>
      <P muted>{t("abg.intro")}</P>
      <RemoteGate state={cases} onRetry={cases.refresh}>
        {(data) => (
          <>
            {data.map((c) => <NavCard key={c.key} href={`/abg/${c.key}`} title={c.title[ar ? 1 : 0]} body={c.vignette} />)}
          </>
        )}
      </RemoteGate>
    </Screen>
  );
}
