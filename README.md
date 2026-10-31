# HematDekat

A web app that shows where staple groceries (sembako) are cheapest in Indonesia. Users browse a map of stores and traditional markets, compare crowdsourced prices per kg or per liter, report new prices and promos, and confirm prices that are still correct.

- Plan, decisions, API contract, and progress: [plan.md](plan.md)
- Rules for AI agents and contributors: [AGENTS.md](AGENTS.md)
- Reference code for repeated patterns: [docs/patterns.md](docs/patterns.md)

## Structure

| Path | What |
| --- | --- |
| `frontend/` | Next.js 16 app (App Router, Tailwind, Google Maps), port 3000 |
| `backend/` | NestJS API (Prisma, PostgreSQL, Passport auth, Places proxy), port 3001 |
| `docker-compose.yml` | Local PostgreSQL on host port 5433 |

## Requirements

- Node.js 20 or newer
- Docker (for PostgreSQL)
- A Google Cloud project with:
  - a browser key for the Maps JavaScript API (HTTP referrer restricted)
  - a server key for Places API (New) (IP and API restricted)
  - an OAuth client for Google sign-in (optional for local development)

## Local setup

1. Start the database from the repo root:

   ```bash
   docker compose up -d
   ```

2. Backend:

   ```bash
   cd backend
   cp .env.example .env        # fill in JWT_SECRET and, if available, Google keys
   npm install
   npx prisma migrate dev
   npx prisma db seed
   npm run start:dev           # http://localhost:3001
   ```

3. Frontend (in a second terminal):

   ```bash
   cd frontend
   cp .env.example .env.local  # fill in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (and NEXT_PUBLIC_GOOGLE_MAP_ID if you have one)
   npm install
   npm run dev                 # http://localhost:3000
   ```

Without a Maps key the map shows a placeholder; without a Places server key, store autocomplete in the report form is disabled.

## Checks

| App | Commands |
| --- | --- |
| Frontend | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` |
| Backend | `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run build` |

Before committing, make sure no Google API key is in the repository (see the security rules in [AGENTS.md](AGENTS.md)).

## Deployment

Deployment notes are written in plan step C13.
