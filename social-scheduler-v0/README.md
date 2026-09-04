# Overlap v0

A tiny social scheduler: create a hangout, share one URL, let each participant OAuth Google Calendar, then rank the best overlapping times.

## Privacy model

- Requests `calendar.freebusy`, not read-only event access.
- Stores encrypted Google OAuth refresh tokens and participant identity.
- Does **not** store event titles, descriptions, attendees, or copied busy intervals.
- Busy intervals are fetched fresh when the hangout page loads.

## Local setup

1. Create a Postgres database (Neon works well) and copy its connection string.
2. In Google Cloud Console, enable Google Calendar API and create a Web OAuth client.
3. Add `http://localhost:3000/api/google/callback` as an authorized redirect URI.
4. Copy `.env.example` to `.env.local` and fill in the values.
5. Generate the encryption key with `openssl rand -base64 32`.
6. `npm install && npm run dev`.

The app lazily creates its two database tables on first use; `db/schema.sql` is included for explicit migrations.

## Vercel

Set these environment variables in the Vercel project:

- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_ENCRYPTION_KEY`

The app derives its production origin from Vercel's built-in `VERCEL_PROJECT_PRODUCTION_URL`, so no custom `APP_URL` is needed.

Add `https://<your-project-production-domain>/api/google/callback` to the Google OAuth client's authorized redirect URIs. Preview deployments use their generated preview URL and therefore require that exact preview callback to be authorized if you want to test OAuth on a preview.

## v0 limitations

- Primary Google Calendar only.
- One timezone per hangout.
- Ranking is intentionally simple: attendance dominates, then Fri/Sat and proximity to 7:30 PM.
- No organizer/admin controls yet.
- No final "book this time" workflow yet.
