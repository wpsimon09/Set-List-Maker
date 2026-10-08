import { json, error } from "@sveltejs/kit";
import { db } from "#lib/server/db.ts";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) error(400, "Invalid song id");

  const [song] = await db()`
    UPDATE songs
    SET played_locked = FALSE
    WHERE id = ${id}
    RETURNING *`;

  if (!song) error(404, "Song not found");
  return json(song);
};
