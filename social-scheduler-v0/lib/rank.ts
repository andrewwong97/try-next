import { DateTime } from "luxon";
import type { BusyInterval, Hangout, Participant, RankedSlot } from "./types";

export function rankSlots(
  hangout: Hangout,
  participants: Participant[],
  busyByParticipant: Map<string, BusyInterval[]>,
): RankedSlot[] {
  const zone = hangout.timezone;
  const duration = hangout.duration_minutes;
  const firstDay = DateTime.fromISO(hangout.date_start, { zone }).startOf("day");
  const lastDay = DateTime.fromISO(hangout.date_end, { zone }).startOf("day");
  const candidates: RankedSlot[] = [];

  for (let day = firstDay; day <= lastDay; day = day.plus({ days: 1 })) {
    const dayStart = day.set({ hour: hangout.earliest_hour, minute: 0 });
    const dayEnd = day.set({ hour: hangout.latest_hour, minute: 0 });

    for (let start = dayStart; start.plus({ minutes: duration }) <= dayEnd; start = start.plus({ minutes: 30 })) {
      const end = start.plus({ minutes: duration });
      const availableNames: string[] = [];
      const unavailableNames: string[] = [];

      for (const participant of participants) {
        const busy = busyByParticipant.get(participant.id) ?? [];
        const overlaps = busy.some((interval) => {
          const busyStart = DateTime.fromISO(interval.start);
          const busyEnd = DateTime.fromISO(interval.end);
          return busyStart < end && busyEnd > start;
        });
        (overlaps ? unavailableNames : availableNames).push(participant.display_name);
      }

      const hourDistance = Math.abs(start.hour + start.minute / 60 - 19.5);
      const fridaySaturdayBonus = start.weekday === 5 || start.weekday === 6 ? 8 : 0;
      const score = availableNames.length * 100 + fridaySaturdayBonus - hourDistance;

      candidates.push({
        start: start.toISO()!,
        end: end.toISO()!,
        availableCount: availableNames.length,
        totalCount: participants.length,
        availableNames,
        unavailableNames,
        score,
      });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score || a.start.localeCompare(b.start))
    .slice(0, 12);
}
