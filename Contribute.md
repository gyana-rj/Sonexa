# Contributing

This is a **pnpm + Turborepo** monorepo (not npm/yarn/bun). Services and ports:

| Path           | Service                | Port |
| -------------- | ---------------------- | ---- |
| `apps/web`     | Next.js Full-Stack App | 3000 |
| `packages/db`  | Prisma schema + client | —    |

## Manual Installation

- Install [pnpm](https://pnpm.io/installation) locally on your machine
- Clone the repo
  - `git clone https://github.com/gyana-rj/sonexa.git`
  - `cd sonexa`
- `pnpm install`
- Start the db locally
  - `docker run --name sonexa-postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=sonexa_db -d -p 5432:5432 postgres:15-alpine`
  - Or go to Neon or Supabase and provision a new DB
- Create and update your `.env` files with the db credentials
  - `packages/db/.env` → `DATABASE_URL`
  - `apps/web/.env` → `DATABASE_URL` (and any other Next.js specific secrets)
- `pnpm --filter db exec prisma db push` (or `migrate dev` for structured migrations)
- `pnpm --filter db exec prisma generate`
- `pnpm run build`
- `pnpm run dev` (development) — or start the app specifically: `pnpm --filter web dev`

## Docker Installation

The application uses a multi-stage Dockerfile located in the repo root. Build from the **repo root** context.

- Install Docker locally on your machine
- Create a network `docker network create sonexa_network`
- Start postgres `docker run --network sonexa_network --name postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=sonexa_db -d -p 5432:5432 postgres:15-alpine`
- Build the image `docker build -t sonexa-web:v1.0 .`
- Start the application container `docker run -e DATABASE_URL=postgresql://postgres:mysecretpassword@postgres:5432/sonexa_db --network sonexa_network -p 3000:3000 sonexa-web:v1.0`

> **Note:** Ensure your database has been migrated before running the production container, or run `pnpm --filter db exec prisma db push` against the remote database URI prior to starting the web container.

## Docker Compose Installation

The easiest way to spin up the entire production-like environment locally.

- Install Docker and Docker Compose
- Bring up the stack:
  - `docker-compose up --build -d`
- **Important:** Containers do not migrate the database on start automatically in this configuration. Once Postgres is up, run the initial migration/push from your local machine (or a temporary node container) targeting the exposed Postgres port:
  - `export DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/sonexa_db"`
  - `pnpm --filter db exec prisma db push`