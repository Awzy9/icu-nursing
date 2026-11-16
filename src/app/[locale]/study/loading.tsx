import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("Study");
  return <p role="status" className="py-10 text-muted-foreground">{t("loading")}</p>;
}
