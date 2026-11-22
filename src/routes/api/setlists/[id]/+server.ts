import { json, error } from "@sveltejs/kit";
import { db } from "#lib/server/db.ts";
import { parseGigDate, parseId } from "#lib/server/rows.ts";
import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({ params, request }) => {
  const id = parseId(params.id, "set list id");
  const { gig_date } = await request.json();
  const gigDate = parseGigDate(gig_date);

  const [setList] = await db()`
    UPDATE set_lists
    SET gig_date = ${gigDate}::date
    WHERE id = ${id}
    RETURNING id, gig_date::text AS gig_date`;

  if (!setList) error(404, "Set list not found");
  return json(setList);
};

export const DELETE: RequestHandler = async ({ params }) => {
  const id = parseId(params.id, "set list id");

  // Its song links are removed by ON DELETE CASCADE.
  const deleted = await db()`DELETE FROM set_lists WHERE id = ${id} RETURNING id`;

  if (deleted.length === 0) error(404, "Set list not found");
  return new Response(null, { status: 204 });
};
