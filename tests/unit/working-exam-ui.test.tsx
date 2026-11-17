import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExamRunner } from "@/components/working/exam-runner";
import { ExamResults } from "@/components/working/exam-results";
import type { ExamQuestion } from "@/lib/working/exam";
import { computeExamResult } from "@/lib/working/exam";

const actions = vi.hoisted(() => ({ answerExam: vi.fn(), submitExam: vi.fn() }));
vi.mock("@/app/[locale]/exam/actions", () => ({ answerExam: actions.answerExam, submitExam: actions.submitExam }));
const push = vi.fn();
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }), Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

const questions: ExamQuestion[] = [
  { id: "Q1", prompt: "Prompt one", options: ["A", "B", "C", "D"], answer: 0, explanation: "Because A.", moduleKey: "EXAMPLE", moduleTitle: "Example lesson", moduleHref: "/working/EXAMPLE", category: "Topic A" },
  { id: "Q2", prompt: "Prompt two", options: ["A", "B", "C", "D"], answer: 1, explanation: "Because B.", moduleKey: "EXAMPLE", moduleTitle: "Example lesson", moduleHref: "/working/EXAMPLE", category: "Topic A" },
];
const exam = { id: "exam-1", questionIds: ["Q1", "Q2"], timeLimitSeconds: 600, startedAt: new Date().toISOString(), submittedAt: null, answers: {} };

beforeEach(() => { actions.answerExam.mockReset().mockResolvedValue({ ok: true }); actions.submitExam.mockReset().mockResolvedValue({ ok: true }); push.mockReset(); });
afterEach(() => cleanup());

describe("ExamRunner", () => {
  it("records a choice through the server action without revealing correctness, and confirms before submitting", async () => {
    render(<ExamRunner exam={exam} serverNow={new Date().toISOString()} questions={questions} locale="en" />);
    expect(screen.getByRole("heading", { name: "Prompt one" })).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: /^A /i }));
    await waitFor(() => expect(actions.answerExam).toHaveBeenCalledWith({ examId: "exam-1", questionId: "Q1", choice: 0 }));
    expect(screen.queryByText("Correct choice", { exact: false })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit exam" }));
    expect(screen.getByText(/1 question still unanswered/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Submit now" }));
    await waitFor(() => expect(actions.submitExam).toHaveBeenCalledWith({ examId: "exam-1" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/exam/exam-1/results"));
  });

  it("resumes at the first unanswered question", () => {
    render(<ExamRunner exam={{ ...exam, answers: { Q1: 0 } }} serverNow={new Date().toISOString()} questions={questions} locale="en" />);
    expect(screen.getByRole("heading", { name: "Prompt two" })).toBeVisible();
  });
});

describe("ExamResults", () => {
  it("shows the overall score, a per-topic breakdown, learning gaps with lesson links, and the non-certification disclaimer", () => {
    const result = computeExamResult(questions, { Q1: 0, Q2: 0 }); // Q1 correct, Q2 wrong
    render(<ExamResults result={result} locale="en" />);
    expect(screen.getByText("1 / 2")).toBeVisible();
    expect(screen.getByText("Prompt two")).toBeVisible();
    expect(screen.getByRole("link", { name: "Read the lesson →" })).toHaveAttribute("href", "/working/EXAMPLE");
    expect(screen.getByText(/does not represent clinical approval or a certification of competence/)).toBeVisible();
  });
});
