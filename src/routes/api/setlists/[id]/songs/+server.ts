import { json, error } from "@sveltejs/kit";
import { db } from "#lib/server/db.ts";
import { parseId } from "#lib/server/rows.ts";
import type { RequestHandler } from "./$types";

/** Add a song to the end of a set list. Archived songs are rejected. */
export const POST: RequestHandler = async ({ params, request }) => {
  const id = parseId(params.id, "set list id");
  const { song_id } = await request.json();
  const songId = parseId(song_id, "song id");

  const [setList] = await db()`SELECT id FROM set_lists WHERE id = ${id}`;
  if (!setList) error(404, "Set list not found");

  const [song] = await db()`SELECT id, archived_at FROM songs WHERE id = ${songId}`;
  if (!song) error(400, "Song not found");
  if (song.archived_at) error(400, "Archived songs can't be added to a set list");

  const inserted = await db()`
    INSERT INTO set_list_songs (set_list_id, song_id, position)
    VALUES (
      ${id},
      ${songId},
      COALESCE(
        (SELECT MAX(position) FROM set_list_songs WHERE set_list_id = ${id}),
        0
      ) + 1
    )
    ON CONFLICT (set_list_id, song_id) DO NOTHING
    RETURNING song_id`;

  if (inserted.length === 0) error(409, "That song is already in this set list");
  return json({ song_id: songId }, { status: 201 });
};

/** Save a new order. Body: `{ song_ids: number[] }`, first song first. */
export const PUT: RequestHandler = async ({ params, request }) => {
  const id = parseId(params.id, "set list id");
  const { song_ids } = await request.json();

  if (!Array.isArray(song_ids)) error(400, "song_ids must be an array");
  const songIds = song_ids.map((s: unknown) => parseId(s, "song id"));

  const [setList] = await db()`SELECT id FROM set_lists WHERE id = ${id}`;
  if (!setList) error(404, "Set list not found");

  // The new order must contain every song of this set list exactly once,
  // so positions stay 1..n with no gaps or duplicates.
  const unique = new Set(songIds);
  if (unique.size !== songIds.length) error(400, "song_ids has duplicates");
  const current = await db()`
    SELECT song_id FROM set_list_songs WHERE set_list_id = ${id}`;
  if (
    current.length !== songIds.length ||
    !current.every((r) => unique.has(r.song_id))
  ) {
    error(409, "song_ids must list every song in this set list exactly once");
  }

  if (songIds.length > 0) {
    await db()`
      UPDATE set_list_songs sls
      SET position = v.pos
      FROM unnest(${db().array(songIds)}::int[]) WITH ORDINALITY AS v(song_id, pos)
      WHERE sls.set_list_id = ${id} AND sls.song_id = v.song_id`;
  }

  return new Response(null, { status: 204 });
};
