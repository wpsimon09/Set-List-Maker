import { error } from "@sveltejs/kit";
import type { Row } from "postgres";
import type { SongRow } from "#lib/types.ts";

export function toSongRow(r: Row): SongRow {
  return {
    id: r.id,
    name: r.name,
    artist: r.artist,
    tabs_link: r.tabs_link,
    created_at: r.created_at.toISOString(),
    archived_at: r.archived_at ? r.archived_at.toISOString() : null,
    last_played: r.last_played ? r.last_played.toISOString() : null,
    times_played: r.times_played,
    played_locked: r.played_locked,
  };
}

export function parseId(raw: unknown, label = "id") {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) error(400, `Invalid ${label}`);
  return id;
}

/** Validates a `YYYY-MM-DD` date string, as sent by `<input type="date">`. */
export function parseGigDate(raw: unknown) {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    error(400, "A valid date is required");
  }
  const [y, m, d] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    error(400, "A valid date is required");
  }
  return raw;
}
