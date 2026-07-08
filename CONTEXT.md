# HRU — Context for Claude

## What this is
Automated news-clipping tool for "Reality Updated" AI show. A Claude Code Routine runs Mon+Wed at noon UTC, finds 8-12 AI news stories, saves them as JSON, and publishes to GitHub Pages. Team gets a Google Chat notification with the link.

## Stack
- `docs/` → GitHub Pages site (served via GitHub Actions deployment)
- `docs/clips/YYYY-MM-DD.json` → clipping output per run
- `docs/clips/index.json` → index of all editions, newest-first
- `docs/clip-viewer.html` → production viewer (DO NOT touch, manually managed)
- `docs/index.html` → edition archive page (DO NOT touch, already in repo)
- `public/` + `server.js` → local production app (run with `node server.js`, port 3001)
- `.claude/settings.json` → allows `Bash(git push origin main)` for routines
- `prompts/clipping.txt` → editorial prompt for the clipping task
- `ROUTINE.md` → SOP for the Claude Code Routine (copy between ▼ and ▲ markers into claude.ai/routines)

## Routine config (claude.ai/routines)
- Repo: `iam-ft/HRU` added, Claude GitHub App installed
- Env "HRUenv": `GCHAT_WEBHOOK` (Google Chat webhook), `GITHUB_TOKEN` (GitHub PAT, renewed July 2026)
- Trigger: `0 12 * * 1,3` (Mon+Wed noon UTC)
- Auth: GitHub proxy handles git auth automatically — DO NOT manually configure git credentials in the SOP

## GitHub Actions workflows
- `.github/workflows/merge-clips.yml` — triggered on push to `claude/daily-clip`, merges to `main`
- `.github/workflows/deploy-pages.yml` — triggered on push to `main`, deploys Pages with 3 auto-retries

## Why two workflows (important)
The `github-pages` environment has a `branch_policy` that only allows deployments from `main`. The routine pushes to `claude/daily-clip` (Routines can't push to main by default — "Allow unrestricted branch pushes" in claude.ai/routines fails to save, likely needs GitHub App properly wired). Splitting merge and deploy into separate workflows respects the policy.

## Problems encountered and root causes
1. **Push blocked** — Routines block `git push` to main without permission. Fixed via `.claude/settings.json` allow rule AND by pushing to `claude/daily-clip` instead.
2. **Can't clone repo** — `GITHUB_TOKEN` env var doesn't configure git automatically. Fixed by renewing the expired PAT and relying on the GitHub proxy (which handles auth when repo is added to routine).
3. **"Allow unrestricted branch pushes" fails to save** — Workaround: push to `claude/daily-clip` + GitHub Actions merge.
4. **Pages deploy failure** — GitHub's automatic Pages deployment is a black box with no retry. Fixed by switching Pages source to "GitHub Actions" and using `actions/deploy-pages` with 3 retries.
5. **Deploy job never starts** — `branch_policy` blocked deploy from `claude/daily-clip` context. Fixed by splitting into two workflows so deploy runs from `main` context.

## Pages setup
GitHub Pages source: **GitHub Actions** (not "Deploy from a branch"). Changed in repo Settings → Pages.

## Key files NOT to modify automatically
- `docs/clip-viewer.html`
- `docs/index.html`

## Local setup for new users
```bash
git clone https://github.com/iam-ft/HRU.git
npm install
node server.js  # opens http://localhost:3001
```
