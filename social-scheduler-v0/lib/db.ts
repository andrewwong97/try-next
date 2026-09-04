import { neon } from "@neondatabase/serverless";
import type { Hangout, Participant } from "./types";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export async function ensureSchema() {
  const q = sql();
  await q`CREATE TABLE IF NOT EXISTS hangouts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    earliest_hour INTEGER NOT NULL DEFAULT 18,
    latest_hour INTEGER NOT NULL DEFAULT 23,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await q`CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY,
    hangout_id TEXT NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
    google_sub TEXT NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT,
    encrypted_refresh_token TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hangout_id, google_sub)
  )`;
}

export async function createHangout(input: Omit<Hangout, "created_at">) {
  await ensureSchema();
  const q = sql();
  const [row] = await q`
    INSERT INTO hangouts (id, title, duration_minutes, date_start, date_end, earliest_hour, latest_hour, timezone)
    VALUES (${input.id}, ${input.title}, ${input.duration_minutes}, ${input.date_start}, ${input.date_end}, ${input.earliest_hour}, ${input.latest_hour}, ${input.timezone})
    RETURNING id, title, duration_minutes, date_start::text, date_end::text, earliest_hour, latest_hour, timezone, created_at::text
  `;
  return row as Hangout;
}

export async function getHangout(id: string) {
  await ensureSchema();
  const q = sql();
  const [row] = await q`
    SELECT id, title, duration_minutes, date_start::text, date_end::text, earliest_hour, latest_hour, timezone, created_at::text
    FROM hangouts WHERE id = ${id}
  `;
  return (row as Hangout | undefined) ?? null;
}

export async function getParticipants(hangoutId: string) {
  await ensureSchema();
  const q = sql();
  const rows = await q`
    SELECT id::text, hangout_id, google_sub, display_name, email, encrypted_refresh_token
    FROM participants
    WHERE hangout_id = ${hangoutId}
    ORDER BY created_at ASC
  `;
  return rows as Participant[];
}

export async function upsertParticipant(input: Participant) {
  await ensureSchema();
  const q = sql();
  await q`
    INSERT INTO participants (id, hangout_id, google_sub, display_name, email, encrypted_refresh_token)
    VALUES (${input.id}, ${input.hangout_id}, ${input.google_sub}, ${input.display_name}, ${input.email}, ${input.encrypted_refresh_token})
    ON CONFLICT (hangout_id, google_sub)
    DO UPDATE SET
      display_name = EXCLUDED.display_name,
      email = EXCLUDED.email,
      encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
      updated_at = NOW()
  `;
}
