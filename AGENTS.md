# AGENTS.md

## Project Overview

Mini Redis project for Wednesday Coding Workshop.

Source of truth order:

1. `docs/01-product-planning.md`
2. `docs/02-architecture.md`
3. `docs/03-api-reference.md`
4. `docs/04-development-guide.md`
5. `README.md`

If these documents conflict, follow the numbered order above.

## How Codex Should Work In This Repo

Before writing code, Codex should:

1. Confirm the current task is inside MVP scope.
2. Keep core Redis logic in `src/lib/mini-redis/`.
3. Keep API contracts synchronized with `docs/03-api-reference.md`.
4. Add/maintain tests for all core behavior changes.
5. Keep `README.md` presentation friendly.

## Stack Commands

- Bootstrap: `npm install`
- Dev run: `npm run dev`
- Local test: `npm test`
- Build: `npm run build`
- Benchmark: `npm run benchmark`

## Definition of Done

A task is complete when:

- Code is implemented
- Tests pass
- Docs are synchronized
- Benchmark/result updates are reflected in README (if performance related)

## Branch Naming

- `feature/<name>`
- `fix/<name>`
- `docs/<name>`
- `test/<name>`
- `chore/<name>`