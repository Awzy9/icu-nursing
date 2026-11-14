#!/bin/bash
# Vercel "Ignored Build Step": exit 1 = build, exit 0 = skip.
# Safety default: ONLY the dedicated "staging" branch is ever built. Connecting this repository to Vercel therefore cannot
# deploy main, feature branches or pull-request previews by accident. Changing this is a deliberate, reviewed decision.
if [ "$VERCEL_GIT_COMMIT_REF" = "staging" ]; then
  echo "Building: branch is staging"
  exit 1
fi
echo "Skipping build: branch '$VERCEL_GIT_COMMIT_REF' is not 'staging'"
exit 0
