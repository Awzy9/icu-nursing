#!/bin/bash
# Vercel Ignored Build Step: exit 1 = build, exit 0 = skip.
# Only staging and the specifically approved latest-preview branch may build.
case "$VERCEL_GIT_COMMIT_REF" in
  staging|preview-latest-20261116)
    echo "Building approved preview branch: $VERCEL_GIT_COMMIT_REF"
    exit 1
    ;;
  *)
    echo "Skipping build: branch '$VERCEL_GIT_COMMIT_REF' is not approved"
    exit 0
    ;;
esac
