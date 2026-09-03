import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encryptSecret } from "@/lib/crypto";
import { getHangout, upsertParticipant } from "@/lib/db";
import { exchangeCode, getGoogleProfile } from "@/lib/google";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawState = url.searchParams.get("state");
  if (!code || !rawState) return NextResponse.json({ error: "Missing OAuth response" }, { status: 400 });

  let state: { hangoutId: string; nonce: string };
  try { state = JSON.parse(Buffer.from(rawState, "base64url").toString("utf8")); }
  catch { return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 }); }

  const cookieStore = await cookies();
  if (!state.nonce || cookieStore.get("overlap_oauth_nonce")?.value !== state.nonce) {
    return NextResponse.json({ error: "OAuth state mismatch" }, { status: 400 });
  }
  if (!(await getHangout(state.hangoutId))) return NextResponse.json({ error: "Hangout not found" }, { status: 404 });

  const tokens = await exchangeCode(code);
  if (!tokens.refresh_token) return NextResponse.json({ error: "Google did not return a refresh token. Reconnect and approve access." }, { status: 400 });
  const profile = await getGoogleProfile(tokens.access_token);

  await upsertParticipant({
    id: crypto.randomUUID(),
    hangout_id: state.hangoutId,
    google_sub: profile.sub,
    display_name: profile.name || profile.email || "Someone",
    email: profile.email ?? null,
    encrypted_refresh_token: encryptSecret(tokens.refresh_token),
  });

  const response = NextResponse.redirect(new URL(`/h/${state.hangoutId}`, request.url));
  response.cookies.delete("overlap_oauth_nonce");
  return response;
}
