import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/content/localize";
import { getSkillService } from "@/lib/skills";
import { resolveMode } from "@/lib/question-bank";
import { CHECKLIST_PHASES, SKILL_SECTIONS } from "@/lib/skills/types";
import { LText } from "@/components/question-bank/localized";
import { LList } from "@/components/skills/llist";
import { SkillActions } from "@/components/skills/skill-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Skills" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function SkillPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Skills");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/.test(code)) notFound();
  const mode = resolveMode();
  if (mode === "disabled") notFound();
  if (mode === "database") await requireUser(locale, `/skills/${code}`);
  const svc = await getSkillService().catch(() => null);
  if (!svc) notFound();
  const s = await svc.get(code).catch(() => undefined);
  if (s === undefined) return <Callout tone="danger">{t("loadError")}</Callout>;
  if (!s) notFound();
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const sections = SKILL_SECTIONS.filter((k) => s.sections[k]);
  const phases = CHECKLIST_PHASES.filter((p) => s.checklist.some((c) => c.phase === p));

  return (
    <article className="space-y-8">
      <p><Link href="/skills">{t("back")}</Link></p>
      <header className="space-y-3">
        <h1 className="text-3xl font-bold"><LText value={s.title} locale={locale} /></h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {s.synthetic ? <Badge tone="warning">{t("syntheticBadge")}</Badge> : null}
          <Badge>{t(`categories.${s.category}`)}</Badge>
          <span className="text-muted-foreground">{t("steps", { n: s.steps })} · {t("revisionVersion", { n: s.version })}</span>
        </div>
        <LText as="p" value={s.summary} locale={locale} className="max-w-prose text-muted-foreground" />
      </header>
      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      <Callout tone="info" role="note">{t("selfStudyNotice")}</Callout>
      <SkillActions skillId={s.id} inProgress={s.in_progress_session} completed={s.sessions_completed} bookmarked={s.bookmarked} />

      <section aria-labelledby="obj" className="space-y-2">
        <h2 id="obj" className="text-xl font-semibold">{t("objectives")}</h2>
        <LList value={s.objectives} locale={locale} />
      </section>
      <section aria-labelledby="pre" className="space-y-2">
        <h2 id="pre" className="text-xl font-semibold">{t("prerequisites")}</h2>
        {s.prerequisites.en && s.prerequisites.en.length > 0 ? <LList value={s.prerequisites} locale={locale} /> : <p className="text-muted-foreground">{t("noPrerequisites")}</p>}
      </section>

      {sections.map((k) => (
        <section key={k} aria-labelledby={`sec-${k}`} className="space-y-2">
          <h2 id={`sec-${k}`} className="flex flex-wrap items-center gap-2 text-xl font-semibold">
            {t(`sections.${k}`)}
            {s.section_support[k] ? <Badge tone={s.section_support[k] === "full" ? "success" : "warning"}>{t(`sectionSupport.${s.section_support[k]}`)}</Badge> : null}
          </h2>
          <LList value={s.sections[k]} locale={locale} />
        </section>
      ))}

      <section aria-labelledby="chk" className="space-y-3">
        <h2 id="chk" className="text-xl font-semibold">{t("checklistTitle")}</h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t("checklistIntro")}</p>
        {phases.map((p) => (
          <div key={p} className="space-y-2">
            <h3 className="font-semibold">{t(`phases.${p}`)}</h3>
            <ol className="list-decimal space-y-1 ps-6">
              {s.checklist.filter((c) => c.phase === p).map((c) => (
                <li key={c.id}>
                  <LText value={c.text} locale={locale} />{" "}
                  {c.critical ? <Badge tone="danger">{t("critical")}</Badge> : null}{" "}
                  {c.support !== "sourced" ? <Badge>{t(`support.${c.support}`)}</Badge> : null}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      <section aria-labelledby="evi" className="space-y-3">
        <h2 id="evi" className="text-xl font-semibold">{t("evidenceTitle")}</h2>
        {s.synthetic ? <Callout tone="info">{t("syntheticEvidence")}</Callout> : null}
        <dl className="grid gap-3 sm:grid-cols-3">
          {[[t("evidenceStatus"), t(`evidence.${s.evidence_status}`)], [t("licenceStatus"), t(`licence.${s.license_status}`)], [t("evidenceDate"), s.evidence_date ? fmt.format(new Date(s.evidence_date)) : t("noDate")]].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border bg-card p-3"><dt className="text-sm text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
        {s.references.length === 0 ? <p className="text-muted-foreground">{t("noReferences")}</p> : (
          <ul className="list-disc space-y-1 ps-5">
            {s.references.map((r, i) => <li key={i}>{r.title}{r.publisher ? `, ${r.publisher}` : ""}{r.year ? ` (${r.year})` : ""}{r.licence ? ` — ${r.licence}` : ""}</li>)}
          </ul>
        )}
      </section>

      <section aria-labelledby="rev" className="space-y-2">
        <h2 id="rev" className="text-xl font-semibold">{t("revisionsTitle")}</h2>
        <ul className="space-y-1">
          {s.revisions.map((r) => (
            <li key={r.version}><span className="font-medium">{t("revisionVersion", { n: r.version })}</span> · <time dateTime={r.changed_at}>{fmt.format(new Date(r.changed_at))}</time> — {localize(r.summary, locale)}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="his" className="space-y-2">
        <h2 id="his" className="text-xl font-semibold">{t("historyTitle")}</h2>
        {s.my_sessions.length === 0 ? <p className="text-muted-foreground">{t("noHistory")}</p> : (
          <ul className="space-y-1">
            {s.my_sessions.map((m) => (
              <li key={m.id}>
                <time dateTime={m.started_at}>{fmt.format(new Date(m.started_at))}</time> ·{" "}
                {m.status === "completed" ? t("historyDone", { done: m.items_done ?? 0, total: m.items_total ?? 0 }) : <Link href={`/skills/session/${m.id}`}>{t("historyInProgress")}</Link>}
                {m.status === "completed" ? <> · <Link href={`/skills/session/${m.id}`}>{t("view")}</Link></> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
