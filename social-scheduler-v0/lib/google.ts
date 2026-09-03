import { decryptSecret } from "./crypto";
import type { BusyInterval, Participant } from "./types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FREE_BUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.freebusy",
].join(" ");

export function googleRedirectUri() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) throw new Error("APP_URL is not configured");
  return `${appUrl}/api/google/callback`;
}

export async function exchangeCode(code: string) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google token exchange failed: ${await response.text()}`);
  return response.json() as Promise<{ access_token: string; refresh_token?: string }>;
}

export async function getGoogleProfile(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to load Google profile");
  return response.json() as Promise<{ sub: string; name?: string; email?: string }>;
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to refresh Google token: ${await response.text()}`);
  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

export async function getBusyIntervals(
  participant: Participant,
  timeMin: string,
  timeMax: string,
  timeZone: string,
): Promise<BusyInterval[]> {
  const accessToken = await refreshAccessToken(decryptSecret(participant.encrypted_refresh_token));
  const response = await fetch(FREE_BUSY_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone,
      items: [{ id: "primary" }],
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google free/busy failed: ${await response.text()}`);
  const payload = (await response.json()) as {
    calendars?: { primary?: { busy?: BusyInterval[] } };
  };
  return payload.calendars?.primary?.busy ?? [];
}
