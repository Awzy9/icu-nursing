# UI Design Guidelines

## Direction
Premium, calm, clinical. Professional navy + teal on neutral surfaces; one accent for warnings. Avoid card-heavy LMS layouts, rainbow charts, decorative animation.

## Tokens (proposed; contrast to be verified in Phase 1)
| Token | Light | Use |
|---|---|---|
| `--navy-900` | #0B2545 | headings, nav |
| `--teal-600` | #0F766E | primary actions, links |
| `--neutral-50/100/700` | #F8FAFC / #F1F5F9 / #334155 | surfaces / text |
| `--warn-600` | #B45309 | warnings, red flags (with icon + text, never colour alone) |
| `--danger-700` | #B91C1C | critical safety callouts |

Dark mode via tokens. All text ≥ 4.5:1 contrast (AA).

## Typography
Inter (or system UI) for body; 16 px minimum; line length 60–75 characters; headings with clear hierarchy. Arabic: Noto Sans Arabic/IBM Plex Arabic, tested early.

## Layout principles
Mobile-first (360 px), bottom or collapsible nav on mobile, sticky in-page TOC on desktop, logical CSS properties for RTL, tap targets ≥ 44 px, tables become stacked on mobile.

## Components
Callouts: **Clinical tip**, **Red flag / escalate**, **Scope note** (nursing vs prescriber), **Local protocol warning**. Diagram figure with caption, source and alt text. MCQ block with immediate feedback. Reference list with source-version.

## Pages
- **Homepage:** brand, one-line explanation, 10 domains, skills, simulation, exam centre, medication reference, progress preview, sign-up/login, about/contact, disclaimer.
- **Dashboard:** welcome, continue learning, domain progress, recommended topics, recently completed, bookmarks, exam performance, simulation history, competency progress — one primary column, restrained widgets.
- **Topic page:** TOC, objectives, structured content, diagrams, tips, warnings, MCQs, references, completion tracking, last-reviewed date and reviewer status.
- **Simulation:** patient monitor panel (synthetic), decision panel, feedback after choice, timeline.

## Accessibility
Keyboard operable, visible focus, semantic landmarks, alt text required in CMS, reduced-motion respected, no meaning by colour alone, axe in CI.

## Wireframes
Not yet produced (Phase 0 deliverable 11). Proposed next step: low-fidelity wireframes for homepage, dashboard, topic page and simulation (Figma is connected to this session; needs your go-ahead).
