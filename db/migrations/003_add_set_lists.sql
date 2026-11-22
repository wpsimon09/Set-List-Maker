-- Date-specific set lists built from songs in the main list.
-- Before running: confirm songs.id is INTEGER (SERIAL). If it is BIGINT,
-- change set_list_songs.song_id to BIGINT to match.

CREATE TABLE IF NOT EXISTS set_lists (
  id         SERIAL PRIMARY KEY,
  gig_date   DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS set_list_songs (
  set_list_id INTEGER NOT NULL REFERENCES set_lists(id) ON DELETE CASCADE,
  -- Archiving a song keeps it here; deleting it removes it from every set list.
  song_id     INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  PRIMARY KEY (set_list_id, song_id)
);

CREATE INDEX IF NOT EXISTS set_list_songs_order_idx
  ON set_list_songs (set_list_id, position);
