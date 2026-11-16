import { describe, expect, it } from "vitest";
import { imageUrl, mapSnapshot, type PublicTopicRow } from "@/lib/content/snapshot";

const row: PublicTopicRow = {
  id: "t1", slug: "x", domain_slug: "d", kind: "clinical", version_no: 3, published_at: "2026-01-02T00:00:00Z", last_reviewed_at: "2026-01-01T00:00:00Z", next_review_at: null,
  snapshot: {
    title: { en: "Title", ar: "عنوان" }, summary: { en: "Sum" }, level: "advanced", est_minutes: 25, guideline_note: "AHA 2025",
    sections: [
      { id: "b", kind: "assessment", sort: 2, title: { en: "B" }, body: { en: "b" } },
      { id: "a", kind: "overview", sort: 1, title: { en: "A" }, body: { en: "a", ar: "أ" } },
    ],
    actions: [{ id: "x", scope: "order_or_protocol_required", text: { en: "Do" }, institutional_protocol_required: true, jurisdiction_note: { en: "varies" }, sort: 0 }],
    references: [{ organization: "KDIGO", title: "AKI", url: "https://k.org", version_label: "2026 DRAFT", is_draft_guideline: true, last_checked: "2026-11-14", citation: null, pinpoint: null, independently_written_note: "own words" }],
    images: [{ id: "i", storage_path: "a b/c.png", alt_text: { en: "alt" }, caption: null, licence: "CC BY 4.0", attribution: "Open RN" }],
    reviewer_roles: ["NE", "PH"],
  },
};

describe("mapSnapshot", () => {
  it("sorts sections, localises with fallback and keeps review metadata", () => {
    const d = mapSnapshot(row, "ar", "https://p.supabase.co");
    expect(d.title).toBe("عنوان");
    expect(d.summary).toBe("Sum");
    expect(d.sections.map((s) => s.id)).toEqual(["a", "b"]);
    expect(d.sections[0]!.body).toBe("أ");
    expect(d.sections[1]!.body).toBe("b");
    expect(d.review).toMatchObject({ versionNo: 3, reviewerRoles: ["NE", "PH"], guidelineNote: "AHA 2025" });
  });
  it("preserves scope labels and draft-guideline flags", () => {
    const d = mapSnapshot(row, "en");
    expect(d.actions[0]).toMatchObject({ scope: "order_or_protocol_required", institutionalProtocolRequired: true, jurisdictionNote: "varies" });
    expect(d.references[0]).toMatchObject({ isDraftGuideline: true, versionLabel: "2026 DRAFT" });
  });
  it("builds safe storage URLs and refuses path traversal", () => {
    expect(imageUrl("https://p.supabase.co/", "a b/c.png")).toBe("https://p.supabase.co/storage/v1/object/public/topic-images/a%20b/c.png");
    expect(imageUrl("https://p.supabase.co", "../secret")).toBeNull();
    expect(imageUrl(undefined, "a.png")).toBeNull();
  });
});
