import { db } from "#lib/server/db.ts";
import type { SetListSummary } from "#lib/types.ts";
import type { LayoutServerLoad } from "./$types";

// Each tile previews the first 3 songs (see the [1:3] slice below).
export const load: LayoutServerLoad = async () => {
  const rows = await db()`
    SELECT sl.id,
           sl.gig_date::text AS gig_date,
           COUNT(sls.song_id)::int AS song_count,
           COALESCE(
             (array_agg(s.name ORDER BY sls.position)
                FILTER (WHERE s.id IS NOT NULL))[1:3],
             '{}'
           ) AS preview
    FROM set_lists sl
    LEFT JOIN set_list_songs sls ON sls.set_list_id = sl.id
    LEFT JOIN songs s ON s.id = sls.song_id
    GROUP BY sl.id
    ORDER BY sl.gig_date, sl.id`;

  const setLists: SetListSummary[] = rows.map((r) => ({
    id: r.id,
    gig_date: r.gig_date,
    song_count: r.song_count,
    preview: r.preview,
  }));

  return { setLists };
};
