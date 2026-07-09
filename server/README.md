# BCS Tickets Backend

This folder contains a minimal Node/Express backend to persist tickets in PostgreSQL and provide staff APIs.

Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, and optionally `REGISTER_SECRET`.
2. Create the database and run the SQL in `sql/init.sql`:

```bash
psql "$DATABASE_URL" -f server/sql/init.sql
```

3. Install dependencies and start the server:

```bash
cd server
npm install
npm start
```

APIs

- POST `/api/tickets` — create a ticket (public). Returns `{ reference }`.
- GET `/api/public/:ref` — public view of a ticket with updates.
- POST `/api/auth/login` — staff login, returns `{ token }`.
- POST `/api/auth/register` — register staff (requires `REGISTER_SECRET` value in request body).
- Protected endpoints (Bearer token required):
  - GET `/api/tickets/:ref` — staff view ticket
  - POST `/api/tickets/:ref/updates` — add an update
  - PUT `/api/tickets/:ref/status` — toggle status

  Docker note

  The Docker image runs a small Node-based wait script (`wait-for-db.js`) that polls Postgres until it accepts connections before starting the API. You can tune `DB_RETRY_MS` and `DB_MAX_ATTEMPTS` via environment variables.
