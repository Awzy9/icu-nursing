import { useState } from "react";
import { View } from "react-native";
import { useCrrtData } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { CrrtCircuitDiagram } from "../../src/ui/crrt-circuit-diagram";
import { Button, Card, H1, H2, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

// Mirrors src/app/[locale]/crrt/page.tsx: a tap-through circuit explorer (CrrtExplorer) plus a
// list of alarm-troubleshooting exercises, combined on a single screen.
export default function CrrtLab() {
  const { t, rtl: ar } = useApp();
  const crrt = useCrrtData();
  const [active, setActive] = useState<string | null>(null);

  return (
    <Screen>
      <H1>{t("crrt.title")}</H1>
      <P muted>{t("crrt.intro")}</P>
      <RemoteGate state={crrt} onRetry={crrt.refresh}>
        {(data) => {
          const activeKey = active ?? data.components[0]?.key ?? null;
          const selected = data.components.find((c) => c.key === activeKey);
          return (
            <>
              <H2>{t("crrt.componentsTitle")}</H2>
              <CrrtCircuitDiagram active={activeKey} />
              <Card>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {data.components.map((c) => (
                    <Button key={c.key} variant={activeKey === c.key ? "primary" : "outline"} label={c.label[ar ? 1 : 0]} onPress={() => setActive(c.key)} />
                  ))}
                </View>
                {selected ? (
                  <View style={{ gap: 4, marginTop: 8 }}>
                    <P>{selected.label[ar ? 1 : 0]}</P>
                    <P small>{selected.description[ar ? 1 : 0]}</P>
                    {selected.alarms.length ? <P small muted>{t("crrt.relatedAlarm", { alarm: selected.alarms[ar ? 1 : 0] })}</P> : null}
                  </View>
                ) : null}
              </Card>

              <H2>{t("crrt.alarmsTitle")}</H2>
              {data.alarms.map((a) => <NavCard key={a.key} href={`/crrt/${a.key}`} title={a.title[ar ? 1 : 0]} body={a.vignette} />)}
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
