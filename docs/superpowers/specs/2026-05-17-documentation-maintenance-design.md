# Documentation Maintenance Strategy

**Date:** 2026-05-17
**Topic:** Maintaining README.md, AGENTS.md, and CLAUDE.md
**Approach:** Option 2 — Full audit + embedded maintenance rules

---

## Problem

README.md and AGENTS.md have drifted from the current codebase state. All areas are potentially outdated: scripts, environment variables, project structure, tech stack, and auth flow. CLAUDE.md is correct as-is.

---

## File Responsibilities

### CLAUDE.md — no changes

One-line delegation to AGENTS.md is the correct Claude Code convention. Do not modify.

### README.md — human landing page

Audience: developers onboarding to the project, GitHub visitors.

**Keep:**
- Quick start (install, env setup, dev server)
- Scripts table (what each command does, no internal detail)
- Environment variables table (what each var is, one-line description only)
- Tech stack table
- License

**Change:**
- Docker section collapses to 2 lines + link to `docs/DOCKER-RUN.md`
- Project structure updated to reflect current `src/` layout (including users, invite, and other recent feature additions)

**Add:**
- `## Documentation` section linking to:
  - `docs/DESIGN_SYSTEM.md` — component usage and Horizon patterns
  - `docs/TOKENS.md` — CSS design tokens reference
  - `docs/DOCKER-RUN.md` — full Docker build and run instructions

### AGENTS.md — AI context file

Audience: Claude Code and other AI agents working in this codebase.

**Audit and refresh all sections:**
- Commands — verify against current `package.json` scripts
- Architecture — verify route groups, middleware matcher, preview mode path
- Auth — verify against current `src/lib/auth.ts` and `src/middleware.ts`
- Feature modules — add any new domains added since last update (users redesign, invite flow, etc.)
- UI section — keep rules, add explicit link to `docs/DESIGN_SYSTEM.md` instead of repeating component lists
- Data layer — verify server actions pattern and SDK usage
- Key environment variables — verify against `.env.igrp.example`
- Conventions — verify Biome version and any new conventions

**Add at the bottom:**

```markdown
## Maintenance

Update README.md when:
- Adding or removing environment variables
- Changing pnpm scripts
- Adding new top-level directories under src/

Update AGENTS.md when:
- Auth flow changes (providers, middleware, session handling)
- New feature modules added under src/features/
- SDK or data-fetching patterns change
- New skills added to .claude/skills/
- Biome or other tooling versions change

Update docs/DESIGN_SYSTEM.md when:
- New Horizon components are available or usage patterns change

Update docs/TOKENS.md when:
- Token definitions or theme override patterns change

Update docs/DOCKER-RUN.md when:
- Docker build or run instructions change
```

---

## Content Boundary Rule

> README describes **what exists** (shallow). AGENTS.md describes **how it works** (deep).

When a new env var is added:
- README gets a row in the table (name + one-line description)
- AGENTS.md gets the behavioral explanation (how it affects auth, SDK, build, etc.)

This rule prevents duplication and clarifies where to look when updating either file.

---

## Docs Folder

The `docs/` files are reference material for both humans and AI:

| File | Owner | Content |
|---|---|---|
| `docs/DESIGN_SYSTEM.md` | Design | Horizon component patterns, imports, usage examples |
| `docs/TOKENS.md` | Design | CSS variables, dark mode, Tailwind aliases |
| `docs/DOCKER-RUN.md` | Infra | Docker build and run commands |

README and AGENTS.md both reference these files rather than duplicating their content.

---

## What Is Out of Scope

- Automated doc generation or CI enforcement — update triggers are embedded in the files themselves
- Merging README and AGENTS.md — they serve different audiences and must stay separate
- Changes to CLAUDE.md — correct as-is
