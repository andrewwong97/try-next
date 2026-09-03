import { DateTime } from "luxon";

export default function Home() {
  const today = DateTime.now().setZone("America/New_York").toISODate()!;
  const twoWeeks = DateTime.now().setZone("America/New_York").plus({ days: 14 }).toISODate()!;

  return (
    <main>
      <div className="eyebrow">Overlap · v0</div>
      <h1>When are we actually free?</h1>
      <p>
        Make a hangout, send one link, and let everyone connect Google Calendar.
        Overlap reads only free/busy and ranks the times that work best.
      </p>

      {!process.env.DATABASE_URL && (
        <p className="notice">Demo shell is deployed, but DATABASE_URL is not configured yet.</p>
      )}

      <form className="card" method="post" action="/api/hangouts">
        <h2>Create a hangout</h2>
        <div className="grid">
          <div className="field full">
            <label htmlFor="title">What are we doing?</label>
            <input id="title" name="title" defaultValue="Dinner" required maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="dateStart">Start looking</label>
            <input id="dateStart" name="dateStart" type="date" defaultValue={today} required />
          </div>
          <div className="field">
            <label htmlFor="dateEnd">Stop looking</label>
            <input id="dateEnd" name="dateEnd" type="date" defaultValue={twoWeeks} required />
          </div>
          <div className="field">
            <label htmlFor="duration">Duration</label>
            <select id="duration" name="duration" defaultValue="120">
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="earliestHour">Earliest start</label>
            <select id="earliestHour" name="earliestHour" defaultValue="18">
              <option value="9">9 AM</option><option value="12">Noon</option><option value="17">5 PM</option><option value="18">6 PM</option><option value="19">7 PM</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="latestHour">Done by</label>
            <select id="latestHour" name="latestHour" defaultValue="23">
              <option value="21">9 PM</option><option value="22">10 PM</option><option value="23">11 PM</option><option value="24">Midnight</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="timezone">Timezone</label>
            <select id="timezone" name="timezone" defaultValue="America/New_York">
              <option value="America/New_York">New York</option>
              <option value="America/Chicago">Chicago</option>
              <option value="America/Denver">Denver</option>
              <option value="America/Los_Angeles">Los Angeles</option>
            </select>
          </div>
        </div>
        <div className="actions" style={{ marginTop: 18 }}>
          <button type="submit">Create link</button>
        </div>
      </form>
    </main>
  );
}
