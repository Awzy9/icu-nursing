import { defineConfig } from "@playwright/test";
export default defineConfig({
 testDir:"tests/account-e2e",timeout:90000,workers:1,retries:process.env.CI?1:0,
 use:{baseURL:"http://localhost:3100",trace:"retain-on-failure",viewport:{width:1280,height:900}},
 webServer:{command:"npm run build && npx next start -H 0.0.0.0 -p 3100",url:"http://localhost:3100/api/health",timeout:180000,reuseExistingServer:false,env:{CONTENT_EDITION:"working",NEXT_PUBLIC_APP_ENV:"staging",VERCEL_ENV:"preview",NEXT_DIST_DIR:".next-account"}},
});
