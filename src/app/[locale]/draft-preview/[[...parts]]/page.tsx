import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// This is a DISPLAY-ONLY staging showcase. It never writes to the learner database,
// marks content as reviewed, or alters a clinical publication gate.
const groups = [
  { id: "topics", title: "ICU nursing topic drafts", folder: "", kind: "md" },
  { id: "skills", title: "Bedside skills drafts", folder: "skills", kind: "json" },
  { id: "medications", title: "ICU medication drafts", folder: "medications", kind: "json" },
  { id: "scenarios", title: "Clinical simulation specifications", folder: "scenarios", kind: "json" },
  { id: "equipment", title: "Equipment education drafts", folder: "equipment", kind: "json" },
  { id: "questions", title: "Additional question-set drafts", folder: "mcq-expansion", kind: "md" },
] as const;
type Group = (typeof groups)[number];
type Item = { slug: string; title: string; file: string; group: Group };

function enabled() {
  return process.env.DRAFT_SHOWCASE_ENABLED === "true"
    && (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development");
}
function root() { return join(process.cwd(), "content", "drafts"); }
function listFiles(group: Group): string[] {
  const base = root();
  if (!existsSync(base)) return [];
  if (group.id === "topics") {
    return readdirSync(base, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^batch-\d{2}$/.test(d.name))
      .flatMap((d) => readdirSync(join(base, d.name))
        .filter((f) => /^D\d{2}-T\d{2}-.+\.md$/.test(f))
        .map((f) => join(d.name, f))).sort();
  }
  const dir = join(base, group.folder);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => group.kind === "json"
      ? /^(SK|MD|SC|EQ)-\d{2}-.+\.json$/.test(f)
      : /^XQ-\d{2}-.+\.md$/.test(f))
    .map((f) => join(group.folder, f)).sort();
}
function heading(raw: string, fallback: string, isJson: boolean): string {
  if (isJson) {
    try {
      const obj = JSON.parse(raw) as Record<string, unknown>;
      const t = obj.title ?? obj.name ?? obj.skill_name ?? obj.device_name ?? obj.topic;
      if (typeof t === "string" && t.trim()) return t;
    } catch { /* Show filename instead. */ }
  } else {
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const title = fm?.[1]?.match(/^title:\s*(.+)$/m)?.[1] || raw.match(/^#\s+(.+)$/m)?.[1];
    if (title) return title.replace(/^["']|["']$/g, "");
  }
  return fallback.replace(/\.(json|md)$/, "").replace(/-/g, " ");
}
function entries(group: Group): Item[] {
  return listFiles(group).map((file) => {
    const basename = file.split(/[\\/]/).at(-1) ?? "";
    const raw = readFileSync(join(root(), file), "utf8");
    return { slug: basename.replace(/\.(json|md)$/, ""), title: heading(raw, basename, group.kind === "json"), file, group };
  });
}
function notice(locale: string) {
  return locale === "ar"
    ? "مسودة تعليمية غير مراجعة سريرياً. ليست إرشاداً للممارسة أو قرارات رعاية المرضى. قد تكون الأدلة وتراخيص المصادر غير مكتملة."
    : "UNREVIEWED EDUCATIONAL DRAFT — NOT FOR CLINICAL USE. Evidence, local protocol requirements, and source permissions may be incomplete. Do not use for patient-care decisions.";
}
function JsonView({ data, depth = 0 }: { data: unknown; depth?: number }) {
  if (data == null) return <span className="text-muted-foreground">Not specified</span>;
  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return <span className="whitespace-pre-wrap break-words">{String(data)}</span>;
  }
  if (depth >= 7) return <span className="text-muted-foreground">See source specification</span>;
  if (Array.isArray(data)) return (
    <ol className="list-decimal space-y-2 ps-5">
      {data.map((value, i) => <li key={i}><JsonView data={value} depth={depth + 1} /></li>)}
    </ol>
  );
  return <dl className="space-y-3">
    {Object.entries(data as Record<string, unknown>).map(([key, value]) => (
      <div key={key} className="rounded border border-border/60 p-3">
        <dt className="mb-1 font-semibold capitalize">{key.replace(/_/g, " ")}</dt>
        <dd className="text-sm leading-relaxed"><JsonView data={value} depth={depth + 1}/></dd>
      </div>
    ))}
  </dl>;
}
function MarkdownView({ raw }: { raw: string }) {
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const chunks = body.split(/\n(?=#{1,4}\s)/g);
  return <div className="space-y-5">
    {chunks.map((block, i) => {
      const m = block.match(/^(#{1,4})\s+(.+?)(?:\r?\n|$)/);
      const title = m?.[2];
      const text = m ? block.slice(m[0].length) : block;
      return <section key={i} className="space-y-2">
        {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
        <div className="max-w-none whitespace-pre-wrap break-words text-sm leading-7">{text.trim()}</div>
      </section>;
    })}
  </div>;
}
type Params = { params: Promise<{ locale: string; parts?: string[] }> };
export async function generateMetadata(): Promise<Metadata> {
  return { title: "Unreviewed project drafts — ICU Nurse Knowledge Map", robots: { index: false, follow: false } };
}
export default async function DraftPreviewPage({ params }: Params) {
  if (!enabled()) notFound();
  const { locale, parts = [] } = await params;
  if (parts.length !== 0 && parts.length !== 2) notFound();
  const base = "/" + locale + "/draft-preview";
  const selected = parts.length === 2 ? groups.find((g) => g.id === parts[0]) : null;
  const all = groups.map((group) => ({ group, items: entries(group) }));
  const item = selected ? all.find((x) => x.group.id === selected.id)?.items.find((x) => x.slug === parts[1]) : undefined;
  if (parts.length === 2 && !item) notFound();

  return <main className="mx-auto max-w-5xl space-y-7">
    <header className="space-y-3">
      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">WORK IN PROGRESS · PUBLIC DEVELOPMENT SHOWCASE</p>
      <h1 className="text-3xl font-bold">{item ? item.title : "Real ICU Nursing Knowledge Map project drafts"}</h1>
      <p className="rounded-lg border-2 border-amber-500 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950 dark:bg-amber-950 dark:text-amber-100" role="alert">{notice(locale)}</p>
      <p className="text-sm text-muted-foreground">English source drafts shown as written; Arabic translation may not yet exist. These are original work files, not approved clinical guidance or functioning patient-care tools.</p>
      <p><Link href={base} className="font-semibold underline">Browse all draft materials</Link></p>
    </header>
    {!item ? <div className="space-y-8">
      <p className="text-muted-foreground">This showcase reads the project draft files directly for inspection. It does not publish them through the learner database or give clinical approval.</p>
      {all.map(({group,items}) => <section key={group.id} className="space-y-3">
        <h2 className="text-2xl font-semibold">{group.title} <span className="text-base font-normal text-muted-foreground">({items.length})</span></h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((it) => <li key={it.slug} className="rounded-md border p-3">
            <Link className="block font-medium underline" href={base + "/" + group.id + "/" + encodeURIComponent(it.slug)}>{it.title}</Link>
            <span className="mt-1 block text-xs text-muted-foreground">{it.slug} · Unreviewed draft</span>
          </li>)}
        </ul>
      </section>)}
    </div> : <article className="space-y-5 rounded-lg border bg-card p-4 sm:p-7">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.group.title} · {item.slug}</p>
      {item.group.kind === "json"
        ? <JsonView data={JSON.parse(readFileSync(join(root(), item.file), "utf8"))} />
        : <MarkdownView raw={readFileSync(join(root(), item.file), "utf8")} />}
      <p className="border-t pt-4 text-sm font-semibold text-amber-700 dark:text-amber-300">{notice(locale)}</p>
    </article>}
  </main>;
}
