import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
 testDir:"tests/working",timeout:30000,retries:process.env.CI?1:0,
 use:{baseURL:"http://127.0.0.1:3300",trace:"retain-on-failure"},
 projects:[{name:"desktop",use:{...devices["Desktop Chrome"]}},{name:"mobile",use:{...devices["Pixel 7"]}}],
 webServer:{command:"npm run build && npx next start -H 127.0.0.1 -p 3300",url:"http://127.0.0.1:3300/api/health",timeout:180000,env:{CONTENT_EDITION:"working",NEXT_PUBLIC_APP_ENV:"staging",NEXT_DIST_DIR:".next-working",NEXT_PUBLIC_SUPABASE_URL:"",NEXT_PUBLIC_SUPABASE_ANON_KEY:""}},
});
