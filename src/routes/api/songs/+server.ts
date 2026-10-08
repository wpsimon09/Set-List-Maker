import { json, error } from "@sveltejs/kit";
import { db } from "#lib/server/db.ts";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const { name, artist, tabs_link } = await request.json();

  if (!name?.trim() || !artist?.trim()) {
    error(400, "Song name and artist are required");
  }

  const [song] = await db()`
    INSERT INTO songs (name, artist, tabs_link)
    VALUES (${name.trim()}, ${artist.trim()}, ${tabs_link?.trim() || null})
    RETURNING *`;

  return json(song, { status: 201 });
};
