# Set list app

Small app for the jam sessions set-list

## Group Play Lock

Click **Played** once after the group performs a song. The song is then
locked so it cannot be counted twice. Click **Unlock** before the group plays
it again.

## Gig set lists

`/setlists` holds set lists for specific gig dates, built from songs in the
main list. Open a tile to add, remove or drag to reorder songs and to change
the date. A new set list can copy its songs from an existing one.

- Removing (archiving) a song keeps it in set lists, but archived songs can't
  be added.
- Deleting an archived song removes it from every set list.
- **Played** inside a set list counts on the main list too.

Requires `db/migrations/003_add_set_lists.sql` to be run against the database.

## AI disclaimer

- most of the app is vibe coded, it is supposed to be used be used by 4 people in the band
- the code is horrible 
