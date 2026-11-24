import { expect,test,type Page } from "@playwright/test";
import { makeUser,cleanup,PASSWORD,signIn } from "../live/helpers";
import { requireIsolated } from "../../scripts/live/target";
requireIsolated("test account learning sync");
const ids:string[]=[];let learner={email:"",id:""},other={email:"",id:""};
test.beforeAll(async()=>{learner=await makeUser("learning-account-a","Learning Test A");other=await makeUser("learning-account-b","Learning Test B");ids.push(learner.id,other.id);});
test.afterAll(async()=>cleanup(ids));
async function login(page:Page,email:string){
 await page.goto("/en/login");
 await page.getByLabel("Email address").fill(email);await page.getByLabel("Password").fill(PASSWORD);
 await expect(page.locator('input[name="captchaToken"]')).not.toHaveValue("",{timeout:30000});
 await page.getByRole("button",{name:"Sign in",exact:true}).click();await expect(page).not.toHaveURL(/\/login/,{timeout:20000});
 await expect(page.getByText("Connected to your account.",{exact:false})).toBeVisible();
}
test("answers, bookmarks and completion follow the account across browsers and stay private",async({browser})=>{
 const first=await browser.newContext(),second=await browser.newContext(),third=await browser.newContext();
 try{
  const a=await first.newPage();await login(a,learner.email);
  await a.goto("/en/working/QB-D06-T01");await a.getByRole("radio").first().check();await a.getByRole("button",{name:"Check answer",exact:true}).click();
  await expect(a.getByText("Saving…",{exact:true})).toHaveCount(0);
  await a.goto("/en/working/SK-02");await a.getByRole("button",{name:"Save for later",exact:true}).click();await expect(a.getByRole("button",{name:"Remove bookmark",exact:true})).toBeVisible();
  await a.getByRole("button",{name:"Mark as completed",exact:true}).click();await expect(a.getByRole("button",{name:"Completed ✓ — undo",exact:true})).toBeVisible();
  const b=await second.newPage();await login(b,learner.email);
  await expect(b.getByRole("link",{name:"Central venous catheter care",exact:true}).first()).toBeVisible();
  await b.goto("/en/study");await expect(b.locator('dt:has-text("Answered") + dd')).toHaveText("1");
  await b.goto("/en/bookmarks");await expect(b.getByRole("link",{name:"Central venous catheter care",exact:true})).toBeVisible();
  const c=await third.newPage();await login(c,other.email);await c.goto("/en/bookmarks");await expect(c.getByRole("link",{name:"Central venous catheter care",exact:true})).toHaveCount(0);
  await c.goto("/en/study");await expect(c.locator('dt:has-text("Answered") + dd')).toHaveText("0");
  await a.getByRole("button",{name:"Sign out",exact:true}).click();
  // Sign-out is a server action that ends the session and then redirects; navigating away before it completes can abort it and leave the session alive.
  await expect(a.getByRole("button",{name:"Sign out",exact:true})).toHaveCount(0);
  // Once signed out, private pages ask for sign-in again and public pages fall back to guest mode.
  await a.goto("/en/study");await expect(a).toHaveURL(/\/en\/login/);
  await a.goto("/en/working/QB-D06-T01");await expect(a.getByText("Guest practice:",{exact:false})).toBeVisible();
 } finally{await first.close();await second.close();await third.close();}
});

test("scenario decisions and missed-answer debrief follow the signed-in learner across browsers",async({browser})=>{
 const first=await browser.newContext(),second=await browser.newContext(),third=await browser.newContext();
 try{
  const a=await first.newPage();await login(a,learner.email);
  await a.goto("/en/working/SC-10");
  await a.getByRole("radio",{name:"Wait and recheck the glucose at the next routine time."}).check();
  await a.getByRole("button",{name:"Confirm decision",exact:true}).click();
  await a.getByRole("button",{name:"Continue",exact:true}).click();
  // Await the actual signed-in server write, not a timer or local optimistic state.
  const client=await signIn(learner.email);
  await expect.poll(async()=>{
   const result=await client.from("working_sessions").select("position,score,decisions").eq("module_key","SC-10").maybeSingle();
   return result.data;
  },{timeout:15000}).toEqual({position:2,score:0,decisions:[{position:1,choice:1}]});
  const b=await second.newPage();await login(b,learner.email);
  await b.goto("/en/working/SC-10");
  await expect(b.getByText("You have an unfinished scenario")).toBeVisible();
  await b.getByRole("button",{name:"Resume",exact:true}).click();
  await b.getByRole("radio",{name:/^Assess airway, breathing and circulation, call for urgent help/}).check();await b.getByRole("button",{name:"Confirm decision",exact:true}).click();await b.getByRole("button",{name:"Continue",exact:true}).click();
  await b.getByRole("radio",{name:/^Continue ordered glucose checks, document and hand over the event/}).check();await b.getByRole("button",{name:"Confirm decision",exact:true}).click();await b.getByRole("button",{name:"Finish and reflect",exact:true}).click();
  await expect(b.getByText("Review priorities")).toBeVisible();
  await expect(b.getByText("Wait and recheck the glucose at the next routine time.",{exact:false})).toBeVisible();
  await expect(b.getByText(/Some earlier answer details are unavailable/)).toHaveCount(0);
  await expect.poll(async()=>{
   const result=await client.from("working_sessions").select("finished,decisions").eq("module_key","SC-10").maybeSingle();return result.data;
  },{timeout:15000}).toEqual({finished:true,decisions:[{position:1,choice:1},{position:2,choice:0},{position:3,choice:0}]});
  const c=await third.newPage();await login(c,other.email);await c.goto("/en/working/SC-10");
  await expect(c.getByText("You have an unfinished scenario")).toHaveCount(0);
 }finally{await first.close();await second.close();await third.close();}
});
