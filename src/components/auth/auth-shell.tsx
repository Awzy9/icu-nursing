import { isDemoMode } from "@/lib/env";
import { getTranslations } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";

export async function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  const t = await getTranslations("Auth.errors");
  return (
    <div className="mx-auto w-full max-w-md space-y-6 py-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      {isDemoMode() ? <Callout tone="warning" role="status">{t("demoUnavailable")}</Callout> : null}
      {children}
    </div>
  );
}
