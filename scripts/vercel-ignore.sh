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
echo "Skipping build: branch/project/environment is not authorized"
exit 0
