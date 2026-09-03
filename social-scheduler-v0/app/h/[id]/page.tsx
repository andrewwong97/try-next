import { DateTime } from "luxon";
import { notFound } from "next/navigation";
import { getHangout, getParticipants } from "@/lib/db";
import { getBusyIntervals } from "@/lib/google";
import { rankSlots } from "@/lib/rank";

export const dynamic = "force-dynamic";

export default async function HangoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hangout = await getHangout(id);
  if (!hangout) notFound();
  const participants = await getParticipants(id);
  const zone = hangout.timezone;
  const timeMin = DateTime.fromISO(hangout.date_start, { zone }).startOf("day").toISO()!;
  const timeMax = DateTime.fromISO(hangout.date_end, { zone }).plus({ days: 1 }).startOf("day").toISO()!;
  const settled = await Promise.allSettled(participants.map(async (p) => [p.id, await getBusyIntervals(p, timeMin, timeMax, zone)] as const));
  const busyByParticipant = new Map();
  const failedIds = new Set<string>();
  settled.forEach((result, i) => result.status === "fulfilled" ? busyByParticipant.set(result.value[0], result.value[1]) : failedIds.add(participants[i].id));
  const active = participants.filter((p) => !failedIds.has(p.id));
  const slots = active.length ? rankSlots(hangout, active, busyByParticipant) : [];

  return (
    <main>
      <a href="/" className="eyebrow" style={{ textDecoration: "none" }}>← Overlap</a>
      <h1 style={{ fontSize: "clamp(40px, 7vw, 64px)" }}>{hangout.title}</h1>
      <div className="meta">
        <span>{hangout.duration_minutes / 60}h</span>
        <span>{DateTime.fromISO(hangout.date_start).toFormat("MMM d")}–{DateTime.fromISO(hangout.date_end).toFormat("MMM d")}</span>
        <span>{hangout.timezone.replace("America/", "")}</span>
      </div>

      <section className="card">
        <h2>Who’s connected</h2>
        <p>Connect Google Calendar once. We only ask Google for busy blocks from your primary calendar.</p>
        <div className="people">
          {participants.length ? participants.map((p) => <span className="person" key={p.id}>{p.display_name}{failedIds.has(p.id) ? " · reconnect" : " ✓"}</span>) : <span className="person">Nobody yet</span>}
        </div>
        <div className="actions" style={{ marginTop: 16 }}>
          <a className="button" href={`/api/google/start?hangout=${id}`}>Connect my Google Calendar</a>
          <a className="button secondary" href={`/h/${id}`}>Refresh availability</a>
        </div>
      </section>

      <section className="card">
        <h2>Best times</h2>
        {!active.length && <p>The rankings appear as soon as at least one calendar is connected and readable.</p>}
        {!!failedIds.size && <p className="notice">Some calendars need to reconnect before they can be included.</p>}
        <div className="slots">
          {slots.map((slot) => {
            const start = DateTime.fromISO(slot.start).setZone(zone);
            const end = DateTime.fromISO(slot.end).setZone(zone);
            return (
              <div className="slot" key={slot.start}>
                <div>
                  <strong>{start.toFormat("ccc, MMM d · h:mm a")}–{end.toFormat("h:mm a")}</strong>
                  <small>{slot.unavailableNames.length ? `Busy: ${slot.unavailableNames.join(", ")}` : "Everyone connected is free"}</small>
                </div>
                <div className="score">{slot.availableCount}/{slot.totalCount} free</div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
