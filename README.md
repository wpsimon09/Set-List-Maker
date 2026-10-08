# Set list app

Small app for the jam sessions set-list

## Database migrations

Run the SQL files in `db/migrations` against the PostgreSQL database before deploying
features that depend on them. The play-tracking feature requires
`db/migrations/001_add_song_play_tracking.sql`.

## AI disclaimer

- most of the app is vibe coded, it is supposed to be used by 4 people and none else
