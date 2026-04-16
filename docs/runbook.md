# FangClaw Runbook

This runbook explains how to run, verify, and troubleshoot the local project
without relying on prior chat history.

## Prerequisites

- Node.js and pnpm available locally.
- Dependencies installed with `pnpm install`.
- A local `.env` file exists when external services or databases are needed.
- Do not print real `.env` values in logs, chats, commits, or documentation.

## Important Environment Variables

See `.env.example` for names and placeholders. Do not copy real secrets into
documentation.

- `NODE_ENV`: `development` or `production`.
- `PORT`: server port. Production helper defaults to `3100` if unset.
- `DATABASE_URL`: MySQL/TiDB URL or SQLite-style local demo URL.
- `JWT_SECRET`: cookie/session secret.
- `OPENAI_BASE_URL` / `BUILT_IN_FORGE_API_URL`: LLM-compatible API base URL.
- `OPENAI_API_KEY` / `BUILT_IN_FORGE_API_KEY`: LLM API key.
- `OPENAI_MODEL_MINI` / `BUILT_IN_FORGE_MODEL_MINI`: lower-cost model.
- `OPENAI_MODEL_PRO` / `BUILT_IN_FORGE_MODEL_PRO`: higher-quality model.
- `IFIND_ENABLED`, `IFIND_BASE_URL`, `IFIND_REFRESH_TOKEN`: iFinD integration.

## Common Commands

Install:

```bash
pnpm install
```

Development:

```bash
pnpm run dev
```

Type check:

```bash
pnpm run check
```

Tests:

```bash
pnpm run test
```

Build:

```bash
pnpm run build
```

Start production bundle:

```bash
pnpm run start
```

Restart local production server:

```bash
pnpm run prod:restart
```

Demo readiness:

```bash
pnpm run check:demo
```

Full verification:

```bash
pnpm run verify
```

Secret scan:

```bash
pnpm run security:scan-secrets
```

Install pre-commit hook:

```bash
pnpm run hooks:install
```

## Local Development Workflow

1. Inspect `git status --short` before editing.
2. Read `docs/handoff.md` for in-progress context.
3. Run `pnpm run dev`.
4. Open the app at the printed local URL.
5. Make focused changes.
6. Run targeted tests for changed server behavior.
7. Run `pnpm run check`.
8. Run `pnpm run build` before claiming production readiness.

## Local Production Demo Workflow

1. Build the app:

```bash
pnpm run build
```

2. Restart production server:

```bash
pnpm run prod:restart
```

3. Open:

```text
http://127.0.0.1:3100
```

4. Check demo readiness:

```bash
pnpm run check:demo
```

`scripts/restart-prod.mjs` finds processes listening on the selected port and
terminates them before starting a detached server. Use it deliberately.

## Data Source Checks

- CNINFO announcements: implemented in `server/data-sources/cninfo.ts`.
- SEC filings: implemented in `server/data-sources/secEdgar.ts`.
- WallstreetCN 7x24 news: implemented in `server/data-sources/wallstreetcn.ts`.
- iFinD real-time quotes: implemented in `server/data-sources/ifind.ts`.

If a data source is empty:

- Check whether the source requires credentials.
- Check whether the provider changed response shape or rate limits.
- Check whether the frontend is showing fallback/empty state correctly.
- Do not fabricate high-confidence data to hide source failures.

## Database Mode Checks

- MySQL/TiDB migrations are managed by Drizzle through `drizzle.config.ts` and
  `drizzle/`.
- SQLite demo mode is implemented in `server/sqliteStore.ts` and is activated
  when `DATABASE_URL` starts with `sqlite:`.
- Do not assume behavior is identical across MySQL/TiDB and SQLite paths; check
  `server/db.ts` before changing persistence behavior.

## LLM Checks

- LLM configuration is read through `server/_core/env.ts`.
- LLM requests and routing are implemented in `server/_core/llm.ts`.
- Lightweight or default tasks should use the mini model when routing permits.
- Complex reasoning and structured analysis should use the pro model when
  routing permits.
- Authentication, permission, quota, and model-name failures should surface as
  visible fallback or error context.

If LLM calls fail:

- Verify key presence without printing the key.
- Verify base URL and model names.
- Verify account quota and model entitlement.
- Verify whether the provider requires custom headers.

## Common Failures

`ERR_CONNECTION_REFUSED` or browser cannot connect:

- The server is not running or is on a different port.
- Run `pnpm run prod:restart` for local production mode.
- Check `.codex-runtime/prod.err.log` only as a local diagnostic artifact.

Page loads but data is empty:

- Run `pnpm run check:demo`.
- Check data source cards in the UI.
- Verify `DATABASE_URL` mode and seed status.

LLM returns 401/403/429:

- 401 usually means invalid key or token.
- 403 usually means no model/provider access or missing provider requirement.
- 429 usually means quota or rate limit.

TypeScript errors:

- Run `pnpm run check`.
- Fix types before relying on runtime behavior.

Build errors:

- Run `pnpm run build`.
- Remember the backend bundle is produced by esbuild from
  `server/_core/index.ts`.

## Commit Safety

- Run `pnpm run security:scan-secrets` before committing.
- Do not commit `.env`, runtime logs, local SQLite files, `dist/`, or
  `node_modules/`.
- If many unrelated changes exist, split commits by feature area.
- If unsure whether a file is user work, ask before reverting it.
