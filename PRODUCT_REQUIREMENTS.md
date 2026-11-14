# Product Requirements (Phase 0 draft)

## Vision
ICU Nurse Knowledge Map — *From Knowledge to Bedside Competence.* A standalone commercial education platform for adult ICU nurses combining a topic library, clinical skills, medication reference, simulation, question bank, progress tracking and (later) a source-grounded AI assistant.

## Audience (initial)
1. Newly graduated nurses entering ICU. 2. Ward nurses transitioning to ICU. 3. ICU nurses with 1–5 years' experience. 4. Experienced nurses preparing for competency exams. 5. Critical-care nursing students.
Excluded for now: PICU, NICU, general ward (schema is specialty-aware).

## Non-goals
Clinical decision support; patient data of any kind; accreditation/CPD claims; copying of NCLEX/AACN/proprietary items; mobile apps before the web platform is stable.

## Feature scope by phase
| Phase | Features |
|---|---|
| 1 | Homepage, auth, dashboard, navigation, search, domains, topic reader, bookmarks, progress, admin CMS + review workflow |
| 2 | 40 topics, original diagrams, MCQs, references |
| 3 | 25 skills + checklists, 50-medication library, SBAR/documentation training |
| 4 | 20 simulations, 300-question bank, timed exams, analytics |
| 5 | RAG assistant |
| 6 | Beta, security/a11y/mobile testing, subscriptions, launch |

## Functional requirements (selected, testable)
- FR-1 Topic pages follow the 20-part template; unavailable parts are omitted, not padded.
- FR-2 Every topic shows learning objectives, references, last-reviewed date and review status.
- FR-3 Learners see only published, approved content.
- FR-4 Progress, bookmarks, exam and simulation history are private to the user.
- FR-5 Exam scores are computed server-side; correct answers are not exposed before submission.
- FR-6 Scenarios label prescriber decisions as such and never score them as nursing actions.
- FR-7 Medication doses/concentrations appear only when pharmacist-reviewed and marked with a local-protocol warning.
- FR-8 Admins can add/edit/archive content and see full revision history; every change is audited.
- FR-9 Site is usable at 360 px width; WCAG 2.1 AA targeted.
- FR-10 RTL-ready layout (logical CSS properties).

## Non-functional
Performance (public pages LCP target ≤ 2.5 s on mid-range mobile), SEO for public pages, accessibility, security (RLS tested, rate limiting), backups with a tested restore, error monitoring, content versioning.

## Market/competitor analysis — **NOT YET DONE**
Phase 0 requires this. It needs structured web research (feature, pricing, licensing and audience comparison of existing ICU/critical-care education products). I deliberately did not write it from memory to avoid fabricating competitor facts. Proposed as the next research task.

## Release-1 acceptance criteria (measurable)
1. 40 P1 topics each: approved by a named clinical reviewer, ≥ 5 verified references, last-reviewed date, ≥ 5 original MCQs.
2. 0 published items without reviewer sign-off (DB-enforced).
3. RLS test suite passes (every learner table: cross-user read/write denied).
4. Exam grading verified server-side; automated test that answers are absent from client payloads.
5. Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95 on key pages; axe has 0 critical issues.
6. Restore from backup demonstrated once.
7. Licence register: all cited sources classified and verified; no RED material reproduced.
8. Legal pages (privacy, ToS, disclaimer) live; no accreditation claims.
9. Beta: ≥ 20 ICU nurses, SUS usability score ≥ 70, 0 unresolved patient-safety content issues.
