import { json, error } from "@sveltejs/kit";
import { db } from "#lib/server/db.ts";
import { parseGigDate, parseId } from "#lib/server/rows.ts";
import type { RequestHandler } from "./$types";

/**
 * Create a set list. Optionally copy the songs (in order) from another set
 * list. Archived songs are skipped, since archived songs can't be added.
 */
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const gigDate = parseGigDate(body.gig_date);
  const copyFrom =
    body.copy_from == null || body.copy_from === ""
      ? null
      : parseId(body.copy_from, "set list to copy from");

  const created = await db().begin(async (sql) => {
    if (copyFrom !== null) {
      const [source] = await sql`SELECT id FROM set_lists WHERE id = ${copyFrom}`;
      if (!source) error(400, "The set list to copy from no longer exists");
    }

    const [setList] = await sql`
      INSERT INTO set_lists (gig_date)
      VALUES (${gigDate}::date)
      RETURNING id, gig_date::text AS gig_date`;

    if (copyFrom !== null) {
      await sql`
        INSERT INTO set_list_songs (set_list_id, song_id, position)
        SELECT ${setList.id}, sls.song_id,
               ROW_NUMBER() OVER (ORDER BY sls.position)
        FROM set_list_songs sls
        JOIN songs s ON s.id = sls.song_id
        WHERE sls.set_list_id = ${copyFrom} AND s.archived_at IS NULL`;
    }

    return setList;
  });

  return json(created, { status: 201 });
};
