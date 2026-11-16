"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const id = z.string().uuid();

export async function toggleBookmarkAction(formData: FormData) {
  const topicId = id.safeParse(formData.get("topicId"));
  const supabase = await createClient();
  if (!topicId.success || !supabase) return;
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  if (formData.get("bookmarked") === "1") await supabase.from("bookmarks").delete().eq("topic_id", topicId.data).eq("user_id", u.user.id);
  else await supabase.from("bookmarks").insert({ topic_id: topicId.data });
  revalidatePath("/", "layout");
}

export async function setCompletionAction(formData: FormData) {
  const topicId = id.safeParse(formData.get("topicId"));
  const supabase = await createClient();
  if (!topicId.success || !supabase) return;
  await supabase.rpc("set_topic_completion", { p_topic: topicId.data, p_completed: formData.get("completed") === "1" });
  revalidatePath("/", "layout");
}

export async function recordViewAction(topicId: string) {
  const parsed = id.safeParse(topicId);
  const supabase = await createClient();
  if (!parsed.success || !supabase) return;
  await supabase.rpc("record_topic_view", { p_topic: parsed.data });
}
