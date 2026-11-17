# CrashLab

CrashLab is a local-first Node.js debugging workspace powered by the real [`whycrash`](https://www.npmjs.com/package/whycrash) npm package. Paste an error, inspect its diagnosis and stack frames, run examples in a Docker container, and save debugging sessions for later.

## Requirements

- Node.js 20.9 or newer (Next.js 16 requirement)
- npm
- Docker Desktop or a local Docker Engine for playground execution
- PostgreSQL is optional

## Start locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`. The analyzer and docs work without credentials. By default, sessions are saved to the ignored `.crashlab/sessions.json` file.

### PostgreSQL persistence

Set `DATABASE_URL` in `.env`, then create the Prisma table:

```bash
npm run db:push
npm run dev
```

The application uses PostgreSQL when `DATABASE_URL` is configured. If a configured database is unavailable, the request returns an error rather than silently switching stores.

### Playground execution

The playground never evaluates user source in the Next.js process. It starts a short-lived Docker container with a read-only root filesystem, no network, 64 MB memory and swap, half a CPU, a 3.5 second timeout, a process limit, dropped Linux capabilities, and a 24 KB output cap. On timeout or output overflow, CrashLab kills the container.

Preload the configured image before running code:

```bash
docker pull node:24-alpine
```

`CRASHLAB_SANDBOX_IMAGE` can select another locally available Node image. The server reports Docker as unavailable when its CLI or daemon cannot be reached. Container isolation reduces risk but is not a perfect security boundary. The playground is intended for a local, single-user development workspace; do not expose it publicly without adding authentication, abuse controls, and a stronger deployment isolation review.

### Optional AI assistant

CrashLab works without AI. For an OpenAI-compatible chat completions API, set these server-side values in `.env`:

```dotenv
AI_API_KEY="your-server-side-key"
AI_API_URL="https://api.openai.com/v1/chat/completions"
AI_MODEL="gpt-4o-mini"
```

Only an explicit **Ask AI** action sends the error and whycrash result to the configured provider. The key remains on the server. AI output is displayed separately from deterministic whycrash output.

## Features

- Landing page and responsive developer workspace
- Error analyzer calling `whycrash.explain()` and `whycrash.parseErrorText()` directly
- Structured diagnosis, confidence, locations, parsed stack frames, and package-supplied fixes
- Copyable and downloadable diagnostic reports
- Monaco JavaScript playground backed by a bounded Docker execution container
- Optional server-side AI explanation
- Session create, rename, reopen, resolve, and delete
- PostgreSQL + Prisma persistence, with a local JSON development fallback
- Analytics computed from saved sessions, with no fabricated demo metrics
- Package documentation based on the upstream README

## Architecture

```text
src/app/                    Next.js App Router pages and API routes
src/components/             Landing, workspace shell, and shared UI
src/lib/whycrash/           Thin real-package adapter and metadata boundary
src/lib/sandbox/            Docker availability and isolated execution worker
src/lib/database/           Prisma client and local-file fallback
src/lib/analytics.ts        Aggregations over saved session records
prisma/schema.prisma        PostgreSQL session model
```

`/api/analyze` calls the installed whycrash package. CrashLab classifies a package rule ID for analytics, but it does not turn an unmatched input into a guessed diagnosis. Package diagnosis fields are separate from CrashLab metadata and optional AI text.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The test suite covers the whycrash integration boundary and session analytics. The Docker playground requires a running Docker daemon and the configured image to exercise end-to-end.

## Known limitations

- whycrash diagnoses Node.js errors only; unsupported inputs are reported as unmatched.
- Pasted text does not give whycrash access to the original project's files, so some context-aware rules may not find a root cause.
- Session storage is single-user and has no authentication layer. Do not expose the app to an untrusted network as-is.
- The playground requires Docker and is not a formal security boundary.
- AI is optional and depends on an operator-provided OpenAI-compatible endpoint.

## Upstream whycrash

- [GitHub repository](https://github.com/Frxzlr/Npm-Package)
- [npm package](https://www.npmjs.com/package/whycrash)
