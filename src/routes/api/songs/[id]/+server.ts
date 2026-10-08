import { json, error } from "@sveltejs/kit";
import { db } from "#lib/server/db.ts";
import type { RequestHandler } from "./$types";

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id)) error(400, "Invalid song id");
  return id;
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  const id = parseId(params.id);
  const { name, artist, tabs_link, archived_at } = await request.json();

  if (!name?.trim() || !artist?.trim()) {
    error(400, "Song name and artist are required");
  }

  const [song] = await db()`
    UPDATE songs
    SET name        = ${name.trim()},
        artist      = ${artist.trim()},
        tabs_link   = ${tabs_link?.trim() || null},
        archived_at = ${archived_at ?? null}
    WHERE id = ${id}
    RETURNING *`;

  if (!song) error(404, "Song not found");
  return json(song);
};

export const DELETE: RequestHandler = async ({ params }) => {
  const id = parseId(params.id);

  const deleted = await db()`DELETE FROM songs WHERE id = ${id} RETURNING id`;

  if (deleted.length === 0) error(404, "Song not found");
  return new Response(null, { status: 204 });
};
