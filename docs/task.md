# Router-Core Task Notes

## Context

This repo follows the Router-Core PRD in `AGENT.md` and uses a monorepo layout.
Primary goals for the next implementation phase:

- Use Drizzle ORM in the backend
- PostgreSQL is the primary DB engine
- SQLite must be supported as an alternate engine
- Frontend must use TanStack Start + shadcn/ui + Tanstack Query
- Validation must be done with Zod on frontend and backend
- Form used in frontend must use react-hook-form
- Make sure the frontend and backend are fully type-safe
- Use Playwright for scraping routers
- Use turborepo, make sure the monorepo is structured correctly and cache is enabled for nest js and tanstack start

## Assumptions

- The API will live in `apps/api` (NestJS)
- Shared DTOs and Zod schemas live in `packages/types`
- Router drivers live in `packages/drivers`
- Playwright will be used for router scraping in drivers

## Planned Work

1. Confirm or create the expected monorepo layout under `apps/` and `packages/`.
2. Add Drizzle to `apps/api` and configure a DB module that supports:
   - PostgreSQL (default)
   - SQLite (alternate)
3. Create `apps/web` with TanStack Start + shadcn/ui and a baseline dashboard layout.
4. Define a minimal schema and Drizzle client wiring that can switch by env vars.
5. Keep credentials in env vars; no hardcoding.

## Suggested Env Vars

- `DB_ENGINE=postgres|sqlite`
- `DATABASE_URL=postgres://user:pass@host:5432/dbname`
- `SQLITE_PATH=./data/dev.sqlite`
- `ROUTER_CREDENTIALS_KEY=base64-encoded-32-byte-key`

## Resume Steps

- Verify folder structure under `apps/` and `packages/`.
- Add Drizzle dependencies and config for Postgres + SQLite.
- Implement DB module and schema wiring in `apps/api`.
- Update docs as implementation progresses.

## Progress

- Confirmed monorepo layout with `apps/api` and `apps/web`.
- Added shared `packages/types` and `packages/drivers` scaffolding.
- Implemented Drizzle DB module with Postgres/SQLite env switching.
- Updated Turbo build outputs for API/Web caching.
- Replaced the web landing page with a Router-Core dashboard baseline using shadcn-style UI and react-hook-form.
- Removed TanStack Start demo routes/content and refreshed the app shell.
- Added a Playwright-backed ZTE driver scaffold in packages/drivers.
- Implemented encrypted router credential storage and router endpoints.
- Hooked dashboard to live router status/devices via TanStack Query.
