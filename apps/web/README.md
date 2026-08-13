# Sonexa

**Your full-stack Next.js application.** Sonexa is a modern, production-ready web application combining both frontend and backend logic into a single Next.js service, powered by a robust Prisma database layer.

---

## Features

- **Unified Full-Stack App.** Both frontend UI and backend API routes are housed within a single Next.js application for streamlined development.
- **Monorepo Architecture.** Managed via Turborepo to keep the application code and database schemas cleanly separated but easily shareable.
- **Type-Safe Database.** Uses Prisma ORM for seamless, heavily typed database interactions.
- **Docker Ready.** Fully containerized multi-stage builds optimized for Next.js standalone output.

## Tech Stack

| Layer      | Tech                                                         |
| ---------- | ------------------------------------------------------------ |
| Full-Stack | Next.js 14/15 · React · Tailwind CSS                         |
| Database   | PostgreSQL · Prisma ORM                                      |
| Monorepo   | Turborepo · pnpm workspaces                                  |
| Deployment | Docker · GitHub Actions                                      |

## Architecture

Sonexa is a pnpm + Turborepo monorepo containing a primary application and a shared DB package:

```mermaid
flowchart LR
    U[User] --> WEB[Next.js App<br/>Frontend & Backend :3000]
    WEB --> DB[(PostgreSQL)]
    PRISMA[packages/db<br/>Prisma Client] -.->|Provides Types & Client| WEB