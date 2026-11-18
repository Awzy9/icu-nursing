import { Linking } from "react-native";
import { Button, Callout, H1, P, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";
import { siteBaseUrl } from "../src/core/remoteContent";

// The website's bespoke interactive practice labs (ECG rhythm strips, ABG interpretation, the
// ventilator and hemodynamics parameter panels, GCS and NEWS2 trainers, CRRT, arterial-line,
// infusion-rate practice, transfusion-reaction and shockable-rhythm exercises) have not been
// ported to native screens yet - each has its own bespoke visualization. Rather than silently
// omitting this learner-facing feature, this screen links out to the real, working website
// versions in the system browser.
export default function Labs() {
  const { t } = useApp();
  const base = siteBaseUrl(process.env as Record<string, string | undefined>);
  return (
    <Screen>
      <H1>{t("labs.title")}</H1>
      <Callout tone="info">{t("labs.body")}</Callout>
      <Button label={t("labs.open")} onPress={() => Linking.openURL(`${base}/learn`)} />
      <P small muted>{base}</P>
    </Screen>
  );
}
