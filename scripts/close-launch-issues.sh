#!/usr/bin/env bash
# Closes the 5 seeded "good first issue" items, marking them moved-to-roadmap.
# Run this AFTER scripts/launch.sh so ROADMAP.md is on main first.
#
# Usage:
#   cd ~/FusionClaw
#   bash scripts/close-launch-issues.sh

set -euo pipefail

REPO="Fusion-Data-Company/FusionClaw"

close_with_comment() {
  local num="$1"
  local label="$2"
  echo ""
  echo "Closing #${num} (${label})…"
  gh issue close "$num" \
    --repo "$REPO" \
    --reason "not planned" \
    --comment "Moving this to [ROADMAP.md](https://github.com/${REPO}/blob/main/ROADMAP.md) so the issue tracker stays focused on real bugs from real users.

If you want to ship this — open a Discussion in **Show and tell** first so we don't end up with overlapping PRs."
}

close_with_comment 1 "Add dark mode demo GIF/video to README"
close_with_comment 2 "Add loading skeletons to all page components"
close_with_comment 3 "Translate README to Spanish"
close_with_comment 4 "Add CSV import for leads"
close_with_comment 5 "Add keyboard shortcuts for common actions"

echo ""
echo "All 5 launch-prep issues closed. Open count is now 0."
echo "https://github.com/${REPO}/issues"
