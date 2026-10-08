import { json, error } from "@sveltejs/kit";
import { db } from "#lib/server/db.ts";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) error(400, "Invalid song id");

  const [song] = await db()`
    UPDATE songs
    SET last_played = NOW(),
        times_played = times_played + 1,
        played_locked = TRUE
    WHERE id = ${id} AND played_locked = FALSE
    RETURNING *`;

  if (!song) {
    const [existing] = await db()`SELECT * FROM songs WHERE id = ${id}`;
    if (!existing) error(404, "Song not found");
    return json(existing, { status: 409 });
  }

  return json(song);
};
