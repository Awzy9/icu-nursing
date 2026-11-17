export interface LearningQuestion { id: string; prompt: string; options: string[]; answer: number; explanation: string }
export interface ScenarioStep { position: number; info: string; prompt: string; observations?: {label:string;value:string|number;unit?:string}[]; options: {text:string;points:number;next:number|null;feedback:string;consequence?:string}[] }
export interface LearningScenario { setting: string; objectives: string[]; steps: ScenarioStep[]; takeaways: string[] }
export interface WorkingEntry { key: string; type: string; title: string; category: string; body: string; questionCount: number; questions?: LearningQuestion[]; scenario?: LearningScenario; checklist?: string[]; practice?: LearningPractice }
export function parseQuestions(body: string, key: string): LearningQuestion[] {
  return body.split(/(?=\*\*Q\d+\s*\()/).slice(1).map((block, i) => {
    const answer = block.match(/\*\*Answer:\s*([A-D])/i);
    const options = [...block.matchAll(/^([A-D])[.)]\s+(.+)$/gm)].map(m => m[2]!.trim());
    const prompt = block.slice(0, block.search(/^A[.)]\s/m)).replace(/^\*\*Q\d+\s*\([^)]*\)[.:]?\*\*\.?\s*/, '').replace(/^\*\*Q\d+\s*\([^)]*\)[.:]?\s*/, '').trim();
    const explanation = block.slice(block.indexOf('**Why correct:')).split(/\n## /)[0]?.replace(/\n---[\s\S]*/, '').trim() ?? '';
    return { id: `${key}-${i+1}`, prompt, options, answer: answer ? answer[1]!.toUpperCase().charCodeAt(0)-65 : -1, explanation };
  }).filter(q => q.options.length === 4 && q.answer >= 0);
}
export interface LearningPractice {
 kind: string; setup: string; prompt?: string; categories?: {id:string;label:string}[];
 items?: {id:string;text:string;category?:string;why?:string}[];
 lines?: {id:string;text:string;problem:boolean;why:string}[];
 options?: {id:string;text:string;correct:boolean;feedback:string}[];
 steps?: {id:string;text:string;why:string}[];
}
