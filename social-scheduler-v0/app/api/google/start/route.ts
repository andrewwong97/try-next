import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getHangout } from "@/lib/db";
import { GOOGLE_SCOPES, googleRedirectUri } from "@/lib/google";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hangoutId = searchParams.get("hangout");
  if (!hangoutId || !(await getHangout(hangoutId))) return NextResponse.json({ error: "Hangout not found" }, { status: 404 });

  const nonce = crypto.randomBytes(20).toString("base64url");
  const state = Buffer.from(JSON.stringify({ hangoutId, nonce })).toString("base64url");
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  }).toString();

  const response = NextResponse.redirect(auth);
  response.cookies.set("overlap_oauth_nonce", nonce, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}
