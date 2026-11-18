import news2CaseData from "../../../content/working-news2-cases.json";
import { news2Band, news2Total, hasSingleRedScore, type News2Consciousness, type News2Scale } from "./news2";

export interface News2Case {
  key: string;
  vignette: string;
  scale: News2Scale;
  respiratoryRate: number;
  spo2: number;
  onOxygen: boolean;
  systolicBp: number;
  pulse: number;
  consciousness: News2Consciousness;
  temperature: number;
  options: string[];
  answer: number;
  explanation: string;
}

const cases = news2CaseData as News2Case[];
export function allNews2Cases(): News2Case[] { return cases; }
export function news2Case(key: string): News2Case | undefined { return cases.find((c) => c.key === key); }

export function news2CaseTotal(c: News2Case): number { return news2Total(c); }
export function news2CaseBand(c: News2Case) { return news2Band(news2CaseTotal(c), hasSingleRedScore(c)); }
