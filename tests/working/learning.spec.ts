import { expect,test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("choose an answer before feedback and see mistakes in revision",async({page})=>{
 await page.goto("/en/working/QB-D06-T01");
 await expect(page.getByText("Correct choice:",{exact:false})).toHaveCount(0);
 const check=page.getByRole("button",{name:"Check answer",exact:true});
 await expect(check).toBeDisabled();
 await page.getByRole("radio").first().check();
 await expect(page.getByText("Correct choice:",{exact:false})).toHaveCount(0);
 await check.click();
 await expect(page.getByRole("status")).toContainText("Correct choice: D");
 if (!(await page.getByRole("link",{name:"Study",exact:true}).isVisible())) await page.getByRole("button",{name:"Menu",exact:true}).click();
 await page.getByRole("link",{name:"Study",exact:true}).click();
 await expect(page.getByRole("link",{name:/Recognising possible sepsis/})).toBeVisible();
});
test("scenario advances after a confirmed decision",async({page})=>{
 await page.goto("/en/working/SC-01");
 await expect(page.getByRole("heading",{name:"Position",exact:true})).toHaveCount(0);
 await expect(page.getByText("Decision feedback",{exact:true})).toHaveCount(0);
 await page.getByRole("radio").first().check();
 await page.getByRole("button",{name:"Confirm decision",exact:true}).click();
 await expect(page.getByRole("status")).toContainText("Decision feedback");
 await page.getByRole("button",{name:"Continue",exact:true}).click();
 await expect(page.getByText("Step 2 / 3",{exact:true})).toBeVisible();
});
test("catalogue is concise, searchable, responsive and accessible",async({page})=>{
 await page.goto("/en/learn");
 await expect(page.getByRole("heading",{name:"What will you learn today?"})).toBeVisible();
 await expect(page.locator("main a[href*='/working/']")).toHaveCount(0);
 const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
 expect(result.violations.filter(v=>v.impact==="serious"||v.impact==="critical")).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole("searchbox").fill("sepsis");
 await page.getByRole("button",{name:"Search",exact:true}).click();
 await expect(page.locator("main a[href*='/working/']").first()).toBeVisible();
});
test("practice exercise hides explanations until submitted",async({page})=>{
 await page.goto("/en/working/PX-04");
 const check=page.getByRole("button",{name:"Check my work",exact:true});
 await expect(check).toBeDisabled();
 await expect(page.getByRole("status")).toHaveCount(0);
 await page.getByRole("radio").first().check();await check.click();
 await expect(page.getByRole("status")).toBeVisible();
});
