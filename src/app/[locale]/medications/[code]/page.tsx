import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/content/localize";
import { getMedicationService } from "@/lib/medications";
import { resolveMode } from "@/lib/question-bank";
import { MEDICATION_SECTIONS } from "@/lib/medications/types";
import { LText } from "@/components/question-bank/localized";
import { LList } from "@/components/skills/llist";
import { MedicationBookmark } from "@/components/medications/bookmark-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Medications" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function MedicationPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Medications");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/.test(code)) notFound();
  const mode = resolveMode();
  if (mode === "disabled") notFound();
  if (mode === "database") await requireUser(locale, `/medications/${code}`);
  const svc = await getMedicationService().catch(() => null);
  if (!svc) notFound();
  const m = await svc.get(code).catch(() => undefined);
  if (m === undefined) return <Callout tone="danger">{t("loadError")}</Callout>;
  if (!m) notFound();
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const sections = MEDICATION_SECTIONS.filter((k) => m.sections[k]);

  return (
    <article className="space-y-8">
      <p><Link href="/medications">{t("back")}</Link></p>
      <header className="space-y-3">
        <h1 className="text-3xl font-bold"><LText value={m.name} locale={locale} /></h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {m.synthetic ? <Badge tone="warning">{t("syntheticBadge")}</Badge> : null}
          {m.high_alert ? <Badge tone="danger">{t("highAlertBadge")}</Badge> : null}
          <Badge>{t(`categories.${m.category}`)}</Badge>
          <span className="text-muted-foreground"><LText value={m.drug_class} locale={locale} /> · {t("revisionVersion", { n: m.version })}</span>
        </div>
        <LText as="p" value={m.summary} locale={locale} className="max-w-prose text-muted-foreground" />
      </header>
      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      <Callout tone="info" role="note">{t("noDosingNotice")}</Callout>
      <MedicationBookmark medicationId={m.id} bookmarked={m.bookmarked} />

      {sections.map((k) => (
        <section key={k} aria-labelledby={`sec-${k}`} className="space-y-2">
          <h2 id={`sec-${k}`} className="flex flex-wrap items-center gap-2 text-xl font-semibold">
            {t(`sections.${k}`)}
            {m.section_support[k] ? <Badge tone={m.section_support[k] === "full" ? "success" : "warning"}>{t(`sectionSupport.${m.section_support[k]}`)}</Badge> : null}
          </h2>
          <LList value={m.sections[k]} locale={locale} />
        </section>
      ))}

      <section aria-labelledby="mon" className="space-y-3">
        <h2 id="mon" className="text-xl font-semibold">{t("monitoringTitle")}</h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t("monitoringIntro")}</p>
        <ol className="list-decimal space-y-1 ps-6">
          {m.monitoring.map((c) => (
            <li key={c.id}>
              <span className="font-medium">{t(`kinds.${c.kind}`)}:</span> <LText value={c.text} locale={locale} />{" "}
              {c.critical ? <Badge tone="danger">{t("critical")}</Badge> : null}{" "}
              {c.support !== "sourced" ? <Badge>{t(`support.${c.support}`)}</Badge> : null}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="lab" className="space-y-3">
        <h2 id="lab" className="text-xl font-semibold">{t("labelTitle")}</h2>
        {m.label_source ? (
          <dl className="grid gap-3 sm:grid-cols-3">
            {[[t("labelSource"), m.label_source], [t("labelVersion"), m.label_version ?? t("noDate")], [t("labelDate"), m.label_date ? fmt.format(new Date(m.label_date)) : t("noDate")]].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-card p-3"><dt className="text-sm text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        ) : <p className="text-muted-foreground">{t("noLabel")}</p>}
        {m.jurisdiction_note ? <p><span className="font-semibold">{t("jurisdiction")}: </span><LText value={m.jurisdiction_note} locale={locale} /></p> : null}
      </section>

      <section aria-labelledby="evi" className="space-y-3">
        <h2 id="evi" className="text-xl font-semibold">{t("evidenceTitle")}</h2>
        {m.synthetic ? <Callout tone="info">{t("syntheticEvidence")}</Callout> : null}
        <dl className="grid gap-3 sm:grid-cols-3">
          {[[t("evidenceStatus"), t(`evidence.${m.evidence_status}`)], [t("licenceStatus"), t(`licence.${m.license_status}`)], [t("evidenceDate"), m.evidence_date ? fmt.format(new Date(m.evidence_date)) : t("noDate")]].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border bg-card p-3"><dt className="text-sm text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
        {m.references.length === 0 ? <p className="text-muted-foreground">{t("noReferences")}</p> : (
          <ul className="list-disc space-y-1 ps-5">
            {m.references.map((r, i) => <li key={i}>{r.title}{r.publisher ? `, ${r.publisher}` : ""}{r.year ? ` (${r.year})` : ""}{r.licence ? ` — ${r.licence}` : ""}</li>)}
          </ul>
        )}
      </section>

      <section aria-labelledby="rev" className="space-y-2">
        <h2 id="rev" className="text-xl font-semibold">{t("revisionsTitle")}</h2>
        <ul className="space-y-1">
          {m.revisions.map((r) => (
            <li key={r.version}><span className="font-medium">{t("revisionVersion", { n: r.version })}</span> · <time dateTime={r.changed_at}>{fmt.format(new Date(r.changed_at))}</time> — {localize(r.summary, locale)}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
