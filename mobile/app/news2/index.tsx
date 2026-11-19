import { useNews2Cases } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { H1, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

export default function News2List() {
  const { t } = useApp();
  const cases = useNews2Cases();

  return (
    <Screen>
      <H1>{t("news2.title")}</H1>
      <P muted>{t("news2.intro")}</P>
      <RemoteGate state={cases} onRetry={cases.refresh}>
        {(data) => (
          <>
            {data.map((c) => <NavCard key={c.key} href={`/news2/${c.key}`} title={c.key} body={c.vignette} />)}
          </>
        )}
      </RemoteGate>
    </Screen>
  );
}
