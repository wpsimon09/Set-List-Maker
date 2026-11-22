import { db } from "#lib/server/db.ts";
import { toSongRow } from "#lib/server/rows.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const rows = await db()`SELECT * FROM songs ORDER BY created_at`;

  return { songs: rows.map(toSongRow) };
};
