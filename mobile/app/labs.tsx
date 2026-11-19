import { Linking } from "react-native";
import { Button, Callout, H1, NavCard, P, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";
import { siteBaseUrl } from "../src/core/remoteContent";

// The website's bespoke interactive visual labs (ECG rhythm strips, ABG interpretation, the
// ventilator and hemodynamics parameter panels, GCS, CRRT, arterial-line, infusion-rate
// practice, transfusion-reaction and shockable-rhythm exercises) have not been ported to native
// screens yet - each has its own bespoke visualization. Rather than silently omitting this
// learner-facing feature, this screen links out to the real, working website versions in the
// system browser. NEWS2 scoring practice is a plain multiple-choice exercise with no custom
// drawing, so it has its own native screen (app/news2/*) and is linked from here instead.
export default function Labs() {
  const { t } = useApp();
  const base = siteBaseUrl(process.env as Record<string, string | undefined>);
  return (
    <Screen>
      <H1>{t("labs.title")}</H1>
      <NavCard href="/news2" title={t("news2.title")} body={t("news2.intro")} />
      <Callout tone="info">{t("labs.body")}</Callout>
      <Button label={t("labs.open")} onPress={() => Linking.openURL(`${base}/learn`)} />
      <P small muted>{base}</P>
    </Screen>
  );
}
