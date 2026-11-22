import { error } from "@sveltejs/kit";
import { db } from "#lib/server/db.ts";
import { toSongRow } from "#lib/server/rows.ts";
import type { SetListDetail } from "#lib/types.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) error(404, "Set list not found");

  const sql = db();
  const [[setList], songs, available] = await Promise.all([
    sql`SELECT id, gig_date::text AS gig_date FROM set_lists WHERE id = ${id}`,
    sql`
      SELECT s.*
      FROM set_list_songs sls
      JOIN songs s ON s.id = sls.song_id
      WHERE sls.set_list_id = ${id}
      ORDER BY sls.position, sls.song_id`,
    // Only active songs can be added to a set list.
    sql`SELECT * FROM songs WHERE archived_at IS NULL ORDER BY name, artist`,
  ]);

  if (!setList) error(404, "Set list not found");

  const detail: SetListDetail = {
    id: setList.id,
    gig_date: setList.gig_date,
    songs: songs.map(toSongRow),
  };

  return { setList: detail, availableSongs: available.map(toSongRow) };
};
