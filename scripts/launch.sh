#!/usr/bin/env bash
# FusionClaw launch executor — Boss runs this once.
#
# What it does:
#   1. Clears any stale .git/index.lock left from previous runs
#   2. Stages the pending launch-prep changes (images, layout, background, mascot copy)
#   3. Commits with a launch-tagged message
#   4. Pushes to origin/main
#   5. Tells you what's left to do manually (Social Preview upload, Discord URL, posts)
#
# Usage:
#   cd ~/FusionClaw
#   bash scripts/launch.sh

set -euo pipefail

cd "$(dirname "$0")/.."

echo ""
echo "=== FusionClaw Launch Executor ==="
echo ""

# 1. Clear stale lock
if [ -f .git/index.lock ]; then
  echo "[1/5] Clearing stale .git/index.lock"
  rm -f .git/index.lock
else
  echo "[1/5] No stale lock — clean state"
fi

# 2. Verify the images we expect actually exist
echo ""
echo "[2/5] Verifying image assets"
for f in public/fusionclaw-hero-bg.png public/fusionclaw-mascot.png docs/images/fusionclaw-mascot.png; do
  if [ -f "$f" ]; then
    SIZE=$(wc -c < "$f")
    echo "    OK  $f ($SIZE bytes)"
  else
    echo "    MISSING  $f"
    exit 1
  fi
done

# 3. Remove the leftover ChatGPT-named duplicates if they still exist
echo ""
echo "[3/5] Cleaning up duplicate source files"
shopt -s nullglob
LEFTOVERS=(public/ChatGPT*Image*.png public/.DS_Store)
if [ ${#LEFTOVERS[@]} -gt 0 ]; then
  for f in "${LEFTOVERS[@]}"; do
    rm -f "$f" && echo "    removed  $f"
  done
else
  echo "    nothing to clean"
fi
shopt -u nullglob

# 4. Stage + commit + push (everything in working tree)
echo ""
echo "[4/5] Staging changes"
git add -A

# Show what we're about to commit
echo ""
echo "    Staged changes:"
git diff --cached --stat | sed 's/^/    /'
echo ""

# Skip commit if nothing staged
if git diff --cached --quiet; then
  echo "    Nothing to commit — working tree matches origin/main"
else
  git commit -m "feat(launch): pre-launch surface fixes — images, OG metadata, dead URLs, install paths

- public/fusionclaw-hero-bg.png (1672x941) — OG card + page background
- public/fusionclaw-mascot.png (941x1672) — portrait mascot
- docs/images/fusionclaw-mascot.png — for docs/index.md hero
- components/ui/BackgroundDecoration.tsx -> /fusionclaw-hero-bg.png
- app/layout.tsx — metadataBase fusionclaw.vercel.app -> fusionclaw.app,
  OG dimensions corrected to 1672x941
- README.md — removed dead demo.fusionclaw.app + docs.fusionclaw.app links
- docs/help/faq.md — removed reference to non-existent demo subdomain
- docs/install/local.md, docs/install/docker.md — replaced curl-pipe-bash
  install commands (scripts don't exist) with canonical git clone path
- docs/start/getting-started.md — same Docker fix
- docs/index.md — same install table fix
- docs/launch-content/{linkedin,instagram,youtube,hackernews,discord,
  github-repo-metadata,launch-day-timeline}.md — replaced dead
  demo.fusionclaw.app + docs.fusionclaw.app + linktr.ee placeholders
  with fusionclaw.app + GitHub docs links
- scripts/launch.sh — repeatable launch executor"
fi

echo ""
echo "[5/5] Pushing to origin/main"
git push origin main

echo ""
echo "=== Push complete ==="
echo ""
echo "Vercel will redeploy automatically. Watch the deploy at:"
echo "  https://vercel.com/fusiondatacompany-projects/fusionclaw"
echo ""
echo "What's left for you to do manually:"
echo ""
echo "  [ ] Upload public/fusionclaw-hero-bg.png as the GitHub Social Preview"
echo "      https://github.com/Fusion-Data-Company/FusionClaw/settings"
echo "      Scroll to 'Social preview' -> Edit -> upload the PNG"
echo ""
echo "  [ ] Create permanent Discord invite, paste URL into:"
echo "      - README.md (line ~20, replace the (#) link)"
echo "      - docs/index.md (search for '[Discord](#)' and replace)"
echo "      - docs/launch-content/discord-setup-and-welcome.md"
echo "      Then commit + push that one-line update."
echo ""
echo "  [ ] When ready to launch:"
echo "      - Post LinkedIn — docs/launch-content/linkedin-launch-post.md"
echo "      - Post Facebook — docs/launch-content/facebook-launch-post.md"
echo "      - Post Instagram — docs/launch-content/instagram-launch-post.md"
echo "      - Post HN — docs/launch-content/hackernews-show-hn.md"
echo "      - Pin Discord welcome — docs/launch-content/discord-setup-and-welcome.md"
echo ""
echo "  [ ] If recording the install video first:"
echo "      Script lives at docs/launch-content/video-scripts.md"
echo ""
echo "Repo metadata is already set:"
echo "  - public, MIT, default branch main"
echo "  - description, homepage https://fusionclaw.app, 10 topics"
echo "  - 5 good-first-issue items seeded"
echo "  - Discussions enabled"
echo ""
