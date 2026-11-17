import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { workingEntry, workingLabels } from "@/lib/working";
import { WorkingNotice } from "@/components/working/catalog";
import { WorkingBody } from "@/components/working/body";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
const sections: Record<string,string> = { topics:"library", questions:"question-bank", skills:"skills", medications:"medications", cases:"cases", equipment:"equipment", practice:"practice" };
export default async function WorkingModule({params}:{params:Promise<{locale:string;key:string}>}) {
  const {locale,key}=await params; setRequestLocale(locale);
  const entry=workingEntry(key); if(!entry) notFound();
  return <article className="mx-auto max-w-4xl space-y-5"><Link href={`/${sections[entry.type] ?? "learn"}`}>← {workingLabels[entry.type]?.[locale === "ar" ? 1 : 0]}</Link><header><p className="text-sm text-muted-foreground">{entry.key} · {entry.category}</p><h1 lang="en" dir="ltr" className="mt-2 text-3xl font-bold">{entry.title}</h1></header><WorkingNotice locale={locale}/><WorkingBody body={entry.body}/></article>;
}
