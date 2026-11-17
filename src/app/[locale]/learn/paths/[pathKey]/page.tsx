import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { findPath } from "@/lib/working/paths";
import { PathDetail } from "@/components/working/paths";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function LearningPathPage({ params }: { params: Promise<{ locale: string; pathKey: string }> }) {
  const { locale, pathKey } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const path = findPath(pathKey);
  if (!path) notFound();
  return <PathDetail path={path} locale={locale} />;
}
