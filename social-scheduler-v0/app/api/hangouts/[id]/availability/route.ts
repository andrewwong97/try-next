import { DateTime } from "luxon";
import { NextResponse } from "next/server";
import { getHangout, getParticipants } from "@/lib/db";
import { getBusyIntervals } from "@/lib/google";
import { rankSlots } from "@/lib/rank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const hangout = await getHangout(id);
  if (!hangout) return NextResponse.json({ error: "Hangout not found" }, { status: 404 });
  const participants = await getParticipants(id);
  const zone = hangout.timezone;
  const timeMin = DateTime.fromISO(hangout.date_start, { zone }).startOf("day").toISO()!;
  const timeMax = DateTime.fromISO(hangout.date_end, { zone }).plus({ days: 1 }).startOf("day").toISO()!;

  const results = await Promise.allSettled(participants.map(async (participant) => [participant.id, await getBusyIntervals(participant, timeMin, timeMax, zone)] as const));
  const busyByParticipant = new Map();
  const errors: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") busyByParticipant.set(result.value[0], result.value[1]);
    else errors.push(participants[i].display_name);
  });

  const activeParticipants = participants.filter((p) => !errors.includes(p.display_name));
  return NextResponse.json({ slots: rankSlots(hangout, activeParticipants, busyByParticipant), errors });
}
