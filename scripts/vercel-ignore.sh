#!/bin/bash
# Vercel "Ignored Build Step": exit 1 = build, exit 0 = skip.
# Staging remains supported. Main builds only in the explicitly authorized production project.
if [ "$VERCEL_GIT_COMMIT_REF" = "staging" ]; then
  echo "Building: branch is staging"
  exit 1
fi
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ] &&
   [ "$VERCEL_PROJECT_ID" = "prj_J2rv5kVPQxEmFqpahGJWHs5O0HUZ" ] &&
   [ "$VERCEL_ENV" = "production" ]; then
  echo "Building: main in the authorized ICU Nursing production project"
  exit 1
fi
# Isolated technical preview: no learner drafts, production credentials, or production alias.
if [ "$VERCEL_GIT_COMMIT_REF" = "release/technical-preview-20261125" ] &&
   [ "$VERCEL_PROJECT_ID" = "prj_J2rv5kVPQxEmFqpahGJWHs5O0HUZ" ] &&
   [ "$VERCEL_ENV" = "preview" ] &&
   [ "$CONTENT_EDITION" = "published" ] &&
   [ "$NEXT_PUBLIC_APP_ENV" = "staging" ] &&
   [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] &&
   [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "Building: isolated technical preview (synthetic demo data only)"
  exit 1
fi
echo "Skipping build: branch/project/environment is not authorized"
exit 0
