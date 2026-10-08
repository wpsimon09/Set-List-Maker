# Set list app

Small app for the jam sessions set-list

## Database migrations

Run the SQL files in `db/migrations` against the PostgreSQL database before deploying
features that depend on them. Apply them in filename order:

1. `db/migrations/001_add_song_play_tracking.sql` adds `last_played` and
   `times_played`.
2. `db/migrations/002_add_group_play_lock.sql` adds `played_locked` for the
   shared group-play lock.

## Shared group-play lock

This app is used by a group, so a song should count as played only once even
when multiple people are using the app. The first person to click **Played**
updates `last_played`, increments `times_played`, and sets `played_locked` to
`true`.

While the song is locked, everyone sees **Allow next play** instead of
**Played**. Clicking **Allow next play** unlocks the song for the group's next
performance without changing the count. The next click on **Played** records
one additional play.

The lock is enforced by a conditional PostgreSQL update, so simultaneous
clicks from multiple users cannot increment the same song more than once.
Users with an already-open page may need to refresh before seeing another
user's latest state. If they click **Played** before refreshing, the server
rejects the duplicate and the page updates that song's state.

Before deploying the updated application, run both migrations against the
production PostgreSQL database. Then deploy the application code to Vercel.

## AI disclaimer

- most of the app is vibe coded, it is supposed to be used by 4 people and none else
