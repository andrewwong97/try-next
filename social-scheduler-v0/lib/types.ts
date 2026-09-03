export type Hangout = {
  id: string;
  title: string;
  duration_minutes: number;
  date_start: string;
  date_end: string;
  earliest_hour: number;
  latest_hour: number;
  timezone: string;
  created_at: string;
};

export type Participant = {
  id: string;
  hangout_id: string;
  google_sub: string;
  display_name: string;
  email: string | null;
  encrypted_refresh_token: string;
};

export type BusyInterval = { start: string; end: string };

export type RankedSlot = {
  start: string;
  end: string;
  availableCount: number;
  totalCount: number;
  availableNames: string[];
  unavailableNames: string[];
  score: number;
};
