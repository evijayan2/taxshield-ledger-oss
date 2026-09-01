#!/usr/bin/env bash
set -euo pipefail

# Safe repo split bootstrap for TaxShield Ledger
# Usage:
#   export GITHUB_ORG="your-github-org"
#   export GITLAB_GROUP="your-gitlab-group"
#   ./scripts/create-split-repos.sh
#
# Optional overrides:
#   export OSS_REPO="taxshield-ledger-oss"
#   export SAAS_REPO="taxshield-ledger-saas"
#   export GITHUB_DEFAULT_BRANCH="main"
#
# Prereqs:
#   - gh installed and authenticated: gh auth login
#   - glab installed and authenticated: glab auth login
#   - ensure your GitHub/GitLab org/group already exists or you have permission

GITHUB_ORG="${GITHUB_ORG:-evijayan2}"
GITLAB_GROUP="${GITLAB_GROUP:-your-gitlab-group}"
OSS_REPO="${OSS_REPO:-taxshield-ledger-oss}"
SAAS_REPO="${SAAS_REPO:-taxshield-ledger-saas}"
GITHUB_DEFAULT_BRANCH="${GITHUB_DEFAULT_BRANCH:-main}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is not installed. Install it and run: gh auth login" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub is not authenticated. Run: gh auth login" >&2
  exit 1
fi

if ! command -v glab >/dev/null 2>&1; then
  echo "GitLab CLI (glab) is not installed. Install it and run: glab auth login" >&2
  exit 1
fi

if ! glab auth status >/dev/null 2>&1; then
  echo "GitLab is not authenticated. Run: glab auth login" >&2
  exit 1
fi

printf 'Creating GitHub OSS repo: %s/%s\n' "$GITHUB_ORG" "$OSS_REPO"
gh repo create "$GITHUB_ORG/$OSS_REPO" \
  --public \
  --source=. \
  --remote=github-oss \
  --push \
  --default-branch "$GITHUB_DEFAULT_BRANCH"

printf '\nCreating GitLab SaaS repo: %s/%s\n' "$GITLAB_GROUP" "$SAAS_REPO"
glab repo create "$GITLAB_GROUP/$SAAS_REPO" \
  --private \
  --clone=false

printf '\nRemote setup complete.\n'
printf 'Next steps:\n'
printf '  git remote -v\n'
printf '  git checkout -b chore/split-shared-core\n'
printf '  git push github-oss HEAD:%s\n' "$GITHUB_DEFAULT_BRANCH"
printf '  git remote add gitlab-saas git@gitlab.com:%s/%s.git\n' "$GITLAB_GROUP" "$SAAS_REPO"
printf '\nThen follow the split plan in docs/repo-split-migration-plan.md.\n'
