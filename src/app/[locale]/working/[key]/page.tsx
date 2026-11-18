import { ModuleSave } from "@/components/working/module-save";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { workingEntry, workingLabels } from "@/lib/working";
import { WorkingNotice } from "@/components/working/catalog";
import { ModuleReader } from "@/components/working/reader";
import { seededOrder } from "@/lib/question-bank/shuffle";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
const sections: Record<string,string> = { topics:"library", questions:"question-bank", skills:"skills", medications:"medications", cases:"cases", equipment:"equipment", practice:"practice" };
export default async function WorkingModule({params}:{params:Promise<{locale:string;key:string}>}) {
  const {locale,key}=await params; setRequestLocale(locale);
  const entry=workingEntry(key); if(!entry) notFound();
  // Deterministic shuffle computed server-side: seededOrder uses node:crypto, which must never
  // reach the client bundle (it breaks the build), so the shuffled step order is computed here
  // and passed down as plain data, never imported into a "use client" component.
  const stepOrder = entry.checklist?.length ? seededOrder(entry.checklist.map((_, i) => String(i)), entry.key, "step-sequence").map(Number) : undefined;
  return <article className="mx-auto max-w-6xl space-y-6"><Link href={`/${sections[entry.type] ?? "learn"}`}>← {workingLabels[entry.type]?.[locale === "ar" ? 1 : 0]}</Link><header><h1 lang="en" dir="ltr" className="mt-2 text-3xl font-bold">{entry.title}</h1></header><WorkingNotice locale={locale}/><ModuleSave module={{key:entry.key,title:entry.title,type:entry.type,href:`/working/${entry.key}`}} locale={locale}/><ModuleReader entry={entry} locale={locale} stepOrder={stepOrder}/></article>;
}
