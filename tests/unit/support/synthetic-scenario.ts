import type { ScenarioDraft } from "@/lib/scenario-draft-validator";

/** A NONCLINICAL branching scenario in the scenario authoring format (fictional ferry office). Used only to test the converter and the case engine. */
export const SYNTHETIC_SOURCES = new Set(["S-SYN-FERRY"]);
const ob = (key: string, label: string, value: number | string, unit?: string) => ({ key, label, value, ...(unit ? { unit } : {}) });
const op = (text: string, points: number, next: number | null, scope: string, feedback: string, consequence: string) => ({ text, points, next, scope, feedback, consequence, support: "partial" as const, sources: ["S-SYN-FERRY"] });

export const SYNTHETIC_SCENARIO: ScenarioDraft = {
  scenario_id: "SYN-SC-01", number: 0, title: "The ferry office scanner alarm", status: "DRAFT", origin: "ai_generated", clinically_reviewed: false, clinical_reviewers: [],
  banner: "DRAFT, NOT clinically reviewed. Synthetic fixture; never imported, published or shown to learners.", fictional_patient: true, synthetic_fixture: true,
  spec_level: "decision_graph", evidence_status: "partial", domain: "fixture", difficulty: 1,
  learning_objectives: ["Check the queue before the scanner.", "Escalate an unexplained alarm.", "Record what happened."],
  related: { skills: [], medications: [], topic_drafts: [] },
  sources: [{ id: "S-SYN-FERRY", read: "partial", use: "fictional office handbook, nonclinical" }],
  gaps: ["Synthetic fixture."], permissions: ["None: invented text."], required_sources: ["None: nonclinical."],
  setting: "A fictional ferry office. This fixture contains no clinical content and exists only to test software.",
  steps: [
    { position: 1, info: "The scanner bell rings and a queue is forming.", prompt: "What do you do first?", observations: [ob("queue", "Queue length (fictional)", 12, "people"), ob("bell", "Bell", "Ringing")],
      options: [op("Look at the queue, then at the scanner.", 2, 2, "assessment", "Looking first shows the cause.", "You see a jam at gate two."), op("Silence the bell and carry on.", 0, 3, "independent_nursing", "Silencing hides the cause.", "The bell returns and the queue grows."), op("Ask the manager to change the queue limit.", 1, 3, "order_or_protocol_required", "Limits are the manager's decision.", "The manager asks you to check the gate first.")] },
    { position: 2, info: "Gate two has a stuck turnstile.", prompt: "What next?", observations: [ob("queue", "Queue length (fictional)", 15, "people"), ob("gate", "Gate two", "Stuck")],
      options: [op("Report the stuck gate to the manager.", 2, 4, "escalation", "Reporting gets it fixed.", "A fitter is called."), op("Force the turnstile open.", 0, 4, "prescriber_or_other_discipline", "Fitters repair turnstiles.", "The turnstile is damaged.")] },
    { position: 3, info: "The bell is still ringing and the queue has grown.", prompt: "What now?", observations: [ob("queue", "Queue length (fictional)", 24, "people"), ob("bell", "Bell", "Ringing again")],
      options: [op("Tell the manager and describe what you saw.", 2, 4, "escalation", "A clear report helps.", "The manager takes over."), op("Wait for the end of the shift.", 0, 4, "independent_nursing", "Waiting delays the fix.", "The queue doubles.")] },
    { position: 4, info: "The problem is being handled.", prompt: "What should you record?", observations: [ob("queue", "Queue length (fictional)", 8, "people"), ob("gate", "Gate two", "Under repair")],
      options: [op("Write down what happened and who was told.", 2, null, "escalation", "A record helps the next shift.", "The next shift knows what happened."), op("Nothing: it is fixed.", 0, null, "independent_nursing", "Without a record the cause is lost.", "The cause is forgotten.")] },
  ],
  debrief: { learning_points: ["Check the situation before silencing an alarm.", "Escalate what you cannot explain.", "Record what happened."], links: [] },
};
