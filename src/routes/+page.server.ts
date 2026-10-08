import { db } from "#lib/server/db.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const rows = await db()`SELECT * FROM songs ORDER BY created_at`;

  return {
    songs: rows.map((r) => ({
      id: r.id,
      name: r.name,
      artist: r.artist,
      tabs_link: r.tabs_link,
      created_at: r.created_at.toISOString(),
      archived_at: r.archived_at ? r.archived_at.toISOString() : null,
    })),
  };
};
