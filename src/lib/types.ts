export type SongRow = {
  id: number;
  name: string;
  artist: string;
  tabs_link: string | null;
  created_at: string;
  archived_at: string | null;
  last_played: string | null;
  times_played: number;
  played_locked: boolean;
};

/** One tile on the set lists page. `gig_date` is a plain `YYYY-MM-DD` string. */
export type SetListSummary = {
  id: number;
  gig_date: string;
  song_count: number;
  preview: string[];
};

/** A set list with its songs in performance order. */
export type SetListDetail = {
  id: number;
  gig_date: string;
  songs: SongRow[];
};
