# Set list app

Small app for the jam sessions set-list

## Database migrations

Run the SQL files in `db/migrations` against the PostgreSQL database before deploying
features that depend on them. Apply them in filename order:

1. `db/migrations/001_add_song_play_tracking.sql` adds `last_played` and
   `times_played`.
2. `db/migrations/002_add_group_play_lock.sql` adds `played_locked` for the
   shared group-play lock.

## AI disclaimer

- most of the app is vibe coded, it is supposed to be used by 4 people and none else
