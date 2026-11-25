import { describe, expect, it } from "vitest";
import { flushReplayBatch, replayEnabled } from "../../mobile/src/core/replayWorker";
import { acknowledgeReplay, type ReplayEvent, type ReplayQueue } from "../../mobile/src/core/progressReplay";

const answer = (at: number, questionId = "QB-D01-T03-1"): ReplayEvent => ({
  kind: "answer", moduleKey: "QB-D01-T03", questionId, choice: 1, correct: true, at,
});
describe("account-bound replay worker", () => {
  it("requires an explicit rollout opt-in", () => {
    expect(replayEnabled(undefined)).toBe(false);
    expect(replayEnabled("false")).toBe(false);
    expect(replayEnabled("1")).toBe(false);
    expect(replayEnabled("true")).toBe(true);
  });
  it("retries the exact event after an ambiguous network failure without acknowledging it", async () => {
    const event = answer(100);
    let queue: ReplayQueue = [event, answer(200)];
    const calls: ReplayEvent[] = [];
    let fail = true;
    const deps = {
      userId: "account-a", isActive: () => true,
      send: async (id:string, e:ReplayEvent) => {
        expect(id).toBe("account-a"); calls.push(e);
        if (fail) throw new Error("response lost");
        return true;
      },
      acknowledge: (e:ReplayEvent) => { queue = acknowledgeReplay(queue,e); },
    };
    expect(await flushReplayBatch(queue,deps)).toBe(0);
    expect(queue).toEqual([event,answer(200)]);
    fail = false;
    expect(await flushReplayBatch(queue,deps)).toBe(1);
    expect(calls).toEqual([event,event]);
    expect(queue).toEqual([answer(200)]);
  });
  it("retains future events while other streams can be accepted", async () => {
    const future = answer(1000);
    const other = answer(100,"QB-D01-T03-2");
    let queue: ReplayQueue = [future,other];
    await flushReplayBatch(queue,{
      userId:"account-a",isActive:()=>true,
      send:async (_id,e)=>e.at<1000,
      acknowledge:e=>{queue=acknowledgeReplay(queue,e);},
    });
    expect(queue).toEqual([future]);
  });
  it("never sends another event or acknowledges an in-flight event after account switch", async () => {
    let active = true;
    let sent = 0;
    const acks:ReplayEvent[]=[];
    const result = await flushReplayBatch([answer(100),answer(200,"QB-D01-T03-2")],{
      userId:"account-a",isActive:()=>active,
      send:async()=>{sent++;active=false;return true;},
      acknowledge:e=>{acks.push(e);},
    });
    expect(result).toBe(0);
    expect(sent).toBe(1);
    expect(acks).toEqual([]);
  });
});
