import { error } from "@sveltejs/kit";
import { db } from "#lib/server/db.ts";
import { parseId } from "#lib/server/rows.ts";
import type { RequestHandler } from "./$types";

/** Remove a song from a set list (the song itself is untouched). */
export const DELETE: RequestHandler = async ({ params }) => {
  const id = parseId(params.id, "set list id");
  const songId = parseId(params.songId, "song id");

  const deleted = await db()`
    DELETE FROM set_list_songs
    WHERE set_list_id = ${id} AND song_id = ${songId}
    RETURNING song_id`;

  if (deleted.length === 0) error(404, "That song isn't in this set list");
  return new Response(null, { status: 204 });
};
