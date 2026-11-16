"use client";
import { useEffect } from "react";
import { recordViewAction } from "@/app/[locale]/library/[slug]/actions";

/** Records a view after hydration (a mutation must not happen during server render). */
export function RecordView({ topicId }: { topicId: string }) {
  useEffect(() => {
    void recordViewAction(topicId);
  }, [topicId]);
  return null;
}
