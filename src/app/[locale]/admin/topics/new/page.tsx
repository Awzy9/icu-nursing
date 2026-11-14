import { setRequestLocale } from "next-intl/server";
import { AdminForm } from "@/components/admin/admin-form";
import { TopicFields } from "@/components/admin/topic-fields";
import { requireStaff } from "@/lib/auth";
import { getContentRepository } from "@/lib/content";
import { createTopicAction } from "../../actions";

export default async function NewTopic({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaff(locale, ["author", "admin"]);
  const domains = await (await getContentRepository()).listDomains("en");
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">New topic</h1>
      <p className="text-muted-foreground">Creates a private draft. Nothing is visible to learners until it is approved by the required reviewers and published.</p>
      <AdminForm action={createTopicAction} submit="Create draft"><TopicFields domains={domains.map((d) => ({ id: "" + d.id, title: d.title }))} /></AdminForm>
    </div>
  );
}
