import React, { useState } from "react";
import { questions } from "../src/core/content";
import { answer, isCorrect, practiceResult, startPractice, type Practice } from "../src/core/engines";
import { localized } from "../src/core/i18n";
import { recordPractice } from "../src/core/progress";
import { useApp } from "../src/state/app";
import { Button, Callout, Card, H1, H2, P, Screen } from "../src/ui/components";

const COUNT = 5;
export default function Quiz() {
  const { t, locale, update } = useApp();
  const [p, setP] = useState<Practice | null>(null);
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  if (!p) return <Screen><H1>{t("quiz.title")}</H1><P muted>{t("hub.questionsBody")}</P><Button label={t("quiz.start")} onPress={() => { setP(startPractice(questions, COUNT, Date.now() % 100000)); setN(0); setPicked(null); setDone(false); }} /></Screen>;
  if (done) { const r = practiceResult(questions, p); return <Screen><H1>{t("quiz.title")}</H1><Card><P>{t("quiz.result", r)}</P></Card><Button label={t("quiz.restart")} onPress={() => setP(null)} /></Screen>; }

  const item = p.items[n]!; const q = questions.find((x) => x.code === item.code)!;
  const checked = p.answers[n] !== null;
  const check = () => { if (picked === null) return; setP(answer(p, n, picked)); };
  const advance = () => { if (n + 1 >= p.items.length) { const r = practiceResult(questions, p); update((s) => recordPractice(s, r.right, r.total, new Date().toISOString())); setDone(true); } else { setN(n + 1); setPicked(null); } };
  return (
    <Screen>
      <P small muted>{t("quiz.question", { n: n + 1, total: p.items.length })}</P>
      <H2>{localized(q.stem, locale)}</H2>
      {item.order.map((optIndex, shown) => {
        const sel = (checked ? p.answers[n] : picked) === shown;
        const ok = checked && optIndex === q.correct;
        return <Button key={shown} variant={sel ? "primary" : "outline"} disabled={checked} label={`${String.fromCharCode(65 + shown)}. ${localized(q.options[optIndex]!, locale)}${checked && ok ? ` ✓ ${t("quiz.correct")}` : ""}`} onPress={() => setPicked(shown)} />;
      })}
      {checked ? <><Callout tone={isCorrect(q, p, n) ? "success" : "danger"}>{isCorrect(q, p, n) ? t("quiz.correct") : t("quiz.incorrect")}</Callout><Card><P>{localized(q.rationale, locale)}</P>{item.order.map((optIndex, shown) => <P key={shown} small muted>{`${String.fromCharCode(65 + shown)}. ${localized(q.explanations[optIndex]!, locale)}`}</P>)}</Card><Button label={n + 1 >= p.items.length ? t("quiz.finish") : t("common.next")} onPress={advance} /></> : <Button label={t("quiz.check")} disabled={picked === null} onPress={check} />}
    </Screen>
  );
}
