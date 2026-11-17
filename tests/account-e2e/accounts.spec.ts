import { expect,test,type Page } from "@playwright/test";
import { makeUser,cleanup,PASSWORD } from "../live/helpers";
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
  await b.goto("/en/study");await expect(b.getByRole("link",{name:/Recognising possible sepsis/})).toBeVisible();
  await b.goto("/en/bookmarks");await expect(b.getByRole("link",{name:"Central venous catheter care",exact:true})).toBeVisible();
  const c=await third.newPage();await login(c,other.email);await c.goto("/en/bookmarks");await expect(c.getByRole("link",{name:"Central venous catheter care",exact:true})).toHaveCount(0);
  await c.goto("/en/study");await expect(c.getByRole("link",{name:/Recognising possible sepsis/})).toHaveCount(0);
  await a.getByRole("button",{name:"Sign out",exact:true}).click();await a.goto("/en/study");await expect(a.getByText("Guest practice:",{exact:false})).toBeVisible();await expect(a.getByRole("link",{name:/Recognising possible sepsis/})).toHaveCount(0);
 } finally{await first.close();await second.close();await third.close();}
});
