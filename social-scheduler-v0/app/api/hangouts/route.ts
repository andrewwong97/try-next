import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createHangout } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const title = String(form.get("title") || "Hangout").trim().slice(0, 80);
  const dateStart = String(form.get("dateStart") || "");
  const dateEnd = String(form.get("dateEnd") || "");
  const duration = Math.min(360, Math.max(30, Number(form.get("duration") || 120)));
  const earliestHour = Math.min(22, Math.max(0, Number(form.get("earliestHour") || 18)));
  const latestHour = Math.min(24, Math.max(1, Number(form.get("latestHour") || 23)));
  const timezone = String(form.get("timezone") || "America/New_York");

  if (!dateStart || !dateEnd || dateEnd < dateStart || latestHour <= earliestHour) {
    return NextResponse.json({ error: "Invalid scheduling window" }, { status: 400 });
  }

  const id = crypto.randomBytes(5).toString("base64url");
  await createHangout({ id, title: title || "Hangout", duration_minutes: duration, date_start: dateStart, date_end: dateEnd, earliest_hour: earliestHour, latest_hour: latestHour, timezone });
  return NextResponse.redirect(new URL(`/h/${id}`, request.url), 303);
}
