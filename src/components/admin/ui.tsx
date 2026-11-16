import { Badge } from "@/components/ui/feedback";

const tone = (s: string) =>
  ({ published: "success", approved: "success", in_review: "warning", changes_requested: "danger", rejected: "danger", archived: "info", draft: "info", superseded: "info", withdrawn: "info" } as const)[s as "draft"] ?? "info";
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={tone(status)}>{status.replace("_", " ")}</Badge>;
}
export const ADMIN_ROLES = ["author", "clinical_reviewer", "publisher", "admin"] as const;
export const REVIEW_CODES = ["NE", "BN", "PH", "RT", "CCP", "NEPH", "NEURO", "IPC", "OTHER"] as const;
export const CODE_LABELS: Record<string, string> = {
  NE: "Senior ICU nurse educator (curriculum lead)", BN: "Experienced ICU nurse (bedside)", PH: "Clinical pharmacist", RT: "Respiratory therapist",
  CCP: "Critical care physician", NEPH: "Nephrology specialist", NEURO: "Neurology specialist", IPC: "Infection prevention specialist", OTHER: "Other specialist",
};
