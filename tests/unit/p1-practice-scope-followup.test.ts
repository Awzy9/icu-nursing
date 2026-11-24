import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const root="content/drafts/practice/";
const paths=[
  "PX-05-a-rising-early-warning-score-that-has-not-reache.json",
  "PX-12-self-assessment-map-of-the-25-first-release-skil.json",
];
describe("practice scope safety",()=>{
  it("does not require reaching a score threshold before emergency response",()=>{
    const d=read(root+paths[0]);
    expect(d.options.filter((o:{correct:boolean})=>o.correct)).toHaveLength(1);
    expect(d.options[0].feedback).toContain("activate the local emergency response without waiting for a score threshold");
  });
  it("does not equate self-rated independence with verified clinical proficiency",()=>{
    const d=read(root+paths[1]);
    expect(d.self_assessment_only).toBe(true);
    expect(d.skills).toHaveLength(25);
    expect(d.setup).toContain("does not establish observed proficiency");
    expect(d.required_sources).toHaveLength(1);
  });
  it.each(paths)("retains review gates and synchronized revisions: %s",path=>{
    const d=read(root+path);
    const row=read("src/content/draft-index.json").entries.find((x:{key:string})=>x.key===d.practice_id);
    const hist=read("src/content/draft-history.json").entries[d.practice_id];
    const hash=createHash("sha256").update(JSON.stringify(d)).digest("hex").slice(0,16);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
    expect(row.hash).toBe(hash);
    expect(hist[hist.length-1].hash).toBe(hash);
    expect(row.required_sources).toBe(d.required_sources.length);
  });
});
