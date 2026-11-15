// Generates supabase/seed_question_fixtures.sql: SYNTHETIC, NONCLINICAL question fixtures for a DEVELOPMENT database.
//   npx tsx scripts/seed-synthetic-questions.ts            -> fixtures are loaded but stay hidden from learners
//   npx tsx scripts/seed-synthetic-questions.ts --visible  -> also sets app_settings.question_fixtures_visible = true
// The file is applied manually to a development database. It is NOT a migration and is never applied by `live:migrate`.
// It cannot create clinical questions: the generator only knows the labelled SYN-* fixtures.
import { writeFileSync } from "node:fs";
import { fixtureSeedSql } from "../src/lib/question-bank/fixtures";
import { caseSeedSql } from "../src/lib/cases/fixtures";
import { skillSeedSql } from "../src/lib/skills/fixtures";
import { medicationSeedSql } from "../src/lib/medications/fixtures";

const visible = process.argv.includes("--visible");
writeFileSync("supabase/seed_question_fixtures.sql", fixtureSeedSql({ makeVisible: visible }));
writeFileSync("supabase/seed_case_fixtures.sql", caseSeedSql());
writeFileSync("supabase/seed_skill_fixtures.sql", skillSeedSql());
writeFileSync("supabase/seed_medication_fixtures.sql", medicationSeedSql());
console.log(`Wrote supabase/seed_question_fixtures.sql, seed_case_fixtures.sql, seed_skill_fixtures.sql and seed_medication_fixtures.sql (fixtures ${visible ? "VISIBLE" : "hidden"} to learners). Apply to a DEVELOPMENT database only.`);
