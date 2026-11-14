# UI Wireframes (low fidelity)

**Status:** documented wireframes + a working local prototype. **Figma was not used this round:** the Figma connector is listed in this environment, but I did not authenticate to or create files in your Figma account, and I did not want to create external artefacts without your go-ahead. Say the word and I will translate these into a Figma file.

**Prototype:** [`design/prototype/index.html`](design/prototype/index.html) — one static file, no build step, open it in a browser (or `python3 -m http.server -d design/prototype`). Seven screens, bottom tab bar, a 2-stage interactive simulation and a sample question. Checked at 390×844 px in Chromium: no horizontal overflow on any screen, no console errors. **All clinical text is placeholder, unreviewed and must not be reused as content.** The prototype grades the sample question in the browser only because it is a demo; the real product grades on the server.

## Design rules applied

Mobile-first (design at 360 px, scale up); one primary action per screen; tap targets ≥ 44 px; max line length ~65 characters; callouts use icon + text + colour (never colour alone); nursing-scope labels visible on every clinical action; sources/last-reviewed always one tap away; logical (RTL-safe) spacing; minimal cards, no decorative animation (reduced-motion respected).

## Navigation map

```
Mobile bottom tabs:  Home/Dashboard · Library · Meds · Simulate · Exams   (+ Search & Profile in header)
Public:  Landing → Browse sample topics → Sign up / Log in
Learner: Dashboard → Library → Domain → Topic → (MCQs | Related skill | Related scenario)
         Meds → Category → Entry          Simulate → Scenario → Debrief       Exams → Mode → Attempt → Review
Staff:   /admin (authoring, review queue, publishing) — separate layout, desktop-first
```

## 1. Landing page (mobile)

```
┌─────────────────────────────┐
│ ☰  ICU Nurse Knowledge Map  👤│
├─────────────────────────────┤
│ From Knowledge to           │
│ Bedside Competence.         │
│ Evidence-based education    │
│ for adult ICU nurses.       │
│ [ Create free account ]     │
│ [ Browse the library  ]     │
├─────────────────────────────┤
│ What you can do             │
│ ▸ 10 clinical domains       │
│ ▸ Clinical simulation       │
│ ▸ Examination centre        │
│ ▸ Medication reference      │
│ ▸ Clinical skills           │
│ ▸ Progress preview ▓▓░░     │
├─────────────────────────────┤
│ How content is reviewed     │
│ Sources · Reviewers · Dates │
├─────────────────────────────┤
│ ⚠ Educational disclaimer    │
│ About · Contact · Privacy   │
└─────────────────────────────┘
```
Desktop: hero left, product preview (monitor-style simulation panel) right; 3-column feature grid. SEO: server-rendered, one H1, sample free topics.

## 2. Learner dashboard

```
┌─────────────────────────────┐
│ Welcome back, [name]        │
│ ┌ Continue learning ──────┐ │
│ │ Respiratory deterioration│ │
│ │ ▓▓▓▓▓░░ 60%  [Resume]   │ │
│ └─────────────────────────┘ │
│ Domain progress             │
│ Respiratory   ▓▓░░░ 35%     │
│ Cardiovascular▓░░░░ 10%     │
│ Recommended next  ▸ ▸       │
│ ┌Exams──┐ ┌Sim──┐           │
│ │ 72 %  │ │ 2   │           │
│ └───────┘ └─────┘           │
│ Bookmarks · Competency      │
└─────────────────────────────┘
```
One primary column; widgets collapse; empty states explain the next step.

## 3. Knowledge library

```
┌─────────────────────────────┐
│ 🔍 Search topics (PEEP…)    │
│ [Level ▾][Domain ▾][Reviewed]│
│ 1 Respiratory & Airway   19 ▸│
│ 2 Cardiovascular         17 ▸│
│ … (10 domains)              │
│ Domain page: topic list with│
│ level tag, minutes, status, │
│ progress tick, review date  │
└─────────────────────────────┘
```
Filters: learner level, domain, "reviewed only" (default on for learners), bookmarked. Search over title, section text and aliases (e.g., "MAP", "ABG").

## 4. Educational topic page

```
┌─────────────────────────────┐
│ ‹ Respiratory   🔖  ⋯       │
│ NOVICE · 30 min · Reviewed ✓│
│ Recognising respiratory     │
│ deterioration               │
│ [On this page ▾]            │
│ Objectives                  │
│ ─────────────────────────── │
│ Why it matters / Assess     │
│ ┌ Diagram (alt text) ─────┐ │
│ ┌ 🚩 Red flag — escalate ─┐ │
│ ┌ ⚠ Scope: nurse vs RT/MD ┐ │
│ Document · Complications    │
│ Check yourself (MCQs)       │
│ References (source, version)│
│ Last reviewed · Reviewers   │
│ [ Mark complete ]           │
└─────────────────────────────┘
```
Sticky TOC on desktop; accordion sections on mobile; sections not needed for a topic are omitted. Footer: "Report an error" → triage queue.

## 5. Medication library

```
┌─────────────────────────────┐
│ 🔍 Search medication        │
│ [Vasopressors][Sedatives]…  │
│ Norepinephrine   UNREVIEWED │
│ Class · Indications         │
│ Monitoring ▸ Administration │
│ safety ▸ Interactions ▸     │
│ ┌ 🚩 Dose/concentration ──┐ │
│ │ hidden until pharmacist │ │
│ │ review. Follow local    │ │
│ │ protocol.               │ │
│ └─────────────────────────┘ │
│ References · Pharmacist ✓   │
└─────────────────────────────┘
```
Entry order follows the 11-field template; status badge always visible.

## 6. Clinical simulation

```
┌─────────────────────────────┐
│ Acute deterioration         │
│ Synthetic fictional patient │
│ Stage 1 of 8                │
│ ┌ HR 125 │ BP 78/42 │ MAP 54┐│
│ └ Temp 39 │ Lact 4.5│ UO 10 ┘│
│ "What do you do first?"     │
│  ( ) A …  ( ) B …           │
│  ( ) C …  ( ) D …           │
│ [ Confirm ]                 │
│ → feedback + scope tag      │
│   (nursing / escalation /   │
│    prescriber decision)     │
│ [ Next stage ]              │
└─────────────────────────────┘
```
Choice-type labels appear **only after** answering (fixed during prototype testing; showing them first gave away the answer). Debrief shows timeline, missed escalations and linked topics. Authoring canvas (React Flow) is desktop-only in `/admin`.

## 7. Examination centre

```
┌─────────────────────────────┐
│ Exam centre                 │
│ [Topic quiz][Domain exam]   │
│ [Random][Timed][Case-based] │
│ Resume attempt ▸            │
│ Attempt: Q 3/20   ⏱ 12:40   │
│ Stem…  A B C D  [Flag][Next]│
│ Review: score, rationale per│
│ option, link to topic,      │
│ weak-area chart             │
└─────────────────────────────┘
```
Server-side timer and grading; answers never sent before submission.

## Illustration direction

Original line-style clinical illustrations (navy/teal), consistent icon set (Lucide), annotated with callout numbers; alt text and source/licence stored per image. No third-party figures (AHA, SCCM, AARC) without permission.

## Open UX questions

1. Do nurses prefer bottom tabs or a drawer? (test in beta)
2. How much reviewer detail to show (names vs roles)?
3. Offline reading on mobile web before native apps?
4. Arabic layout review by native clinicians.
