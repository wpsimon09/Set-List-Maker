<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import Header from "#lib/components/Header.svelte";
  import Song from "#lib/components/Song.svelte";
  import AddSongForm from "#lib/components/AddSong.svelte";

  type SongRow = {
    id: number;
    name: string;
    artist: string;
    tabs_link: string | null;
    created_at: string;
    archived_at: string | null;
  };

  let showHistory = $state(false);
  let addOpened = $state(false);

  const tabs = (query: string) =>
    `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(query)}`;

  // Fake data shaped like the `songs` table
  let songs = $state<SongRow[]>([
    {
      id: 1,
      name: "Seven Nation Army",
      artist: "The White Stripes",
      tabs_link: tabs("Seven Nation Army"),
      created_at: "2026-09-01T18:00:00Z",
      archived_at: null,
    },
    {
      id: 2,
      name: "Smells Like Teen Spirit",
      artist: "Nirvana",
      tabs_link: tabs("Smells Like Teen Spirit"),
      created_at: "2026-09-01T18:05:00Z",
      archived_at: null,
    },
    {
      id: 3,
      name: "Back in Black",
      artist: "AC/DC",
      tabs_link: tabs("Back in Black"),
      created_at: "2026-09-02T19:30:00Z",
      archived_at: null,
    },
    {
      id: 4,
      name: "Mr. Brightside",
      artist: "The Killers",
      tabs_link: tabs("Mr Brightside"),
      created_at: "2026-09-05T20:10:00Z",
      archived_at: null,
    },
    {
      id: 5,
      name: "Song 2",
      artist: "Blur",
      tabs_link: null,
      created_at: "2026-09-10T17:45:00Z",
      archived_at: null,
    },
    {
      id: 6,
      name: "Purple Haze",
      artist: "Jimi Hendrix",
      tabs_link: tabs("Purple Haze"),
      created_at: "2026-09-12T21:00:00Z",
      archived_at: null,
    },
    // Songs that are no longer on the set list
    {
      id: 7,
      name: "Wonderwall",
      artist: "Oasis",
      tabs_link: tabs("Wonderwall"),
      created_at: "2026-08-10T18:00:00Z",
      archived_at: "2026-09-08T22:15:00Z",
    },
    {
      id: 8,
      name: "Sweet Child O' Mine",
      artist: "Guns N' Roses",
      tabs_link: tabs("Sweet Child O Mine"),
      created_at: "2026-08-12T19:00:00Z",
      archived_at: "2026-09-20T20:30:00Z",
    },
    {
      id: 9,
      name: "Highway to Hell",
      artist: "AC/DC",
      tabs_link: null,
      created_at: "2026-08-15T18:30:00Z",
      archived_at: "2026-08-30T21:00:00Z",
    },
  ]);

  let setList = $derived(songs.filter((s) => s.archived_at === null));

  let pastSongs = $derived(
    songs
      .filter((s) => s.archived_at !== null)
      .sort((a, b) => b.archived_at!.localeCompare(a.archived_at!)),
  );

  // Replace these with calls to your backend later
  function updateSong(updated: SongRow) {
    songs = songs.map((s) => (s.id === updated.id ? updated : s));
  }

  function archiveSong(song: SongRow) {
    updateSong({ ...song, archived_at: new Date().toISOString() });
  }

  function restoreSong(song: SongRow) {
    updateSong({ ...song, archived_at: null });
  }

  function deleteSong(song: SongRow) {
    songs = songs.filter((s) => s.id !== song.id);
  }

  function openAdd() {
    addOpened = true;
  }

  function closeAdd() {
    addOpened = false;
  }

  function addSong(song: SongRow) {
    songs.push(song);
    closeAdd();
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (addOpened && e.key === "Escape") closeAdd();
  }}
/>

<main class="w-full min-h-screen flex flex-col items-center bg-zinc-900">
  <div
    class="w-full sticky top-0 z-20 items-center flex flex-col p-1 bg-zinc-900 border border-white/20 rounded-b-lg shadow-2xl"
  >
    <h1 class="text-3xl text-white opacity-50 mt-4">Set List</h1>
    <Header bind:showHistory onAdd={openAdd}></Header>
  </div>

  <section class="w-full md:w-3/4 lg:w-1/2 flex flex-col gap-2 p-3 sm:p-4">
    {#if showHistory}
      {#each pastSongs as song (song.id)}
        <Song {song} onrestore={restoreSong} ondelete={deleteSong} />
      {:else}
        <p class="text-white/50 text-center py-8">
          Songs you remove from the set list will show up here.
        </p>
      {/each}
    {:else}
      {#each setList as song (song.id)}
        <Song {song} onsave={updateSong} onarchive={archiveSong} />
      {:else}
        <p class="text-white/50 text-center py-8">
          No songs yet. Use Add to start your set list.
        </p>
      {/each}
    {/if}
  </section>
</main>

{#if addOpened}
  <!-- Backdrop: fades in/out, click outside the form to close -->
  <div
    role="presentation"
    transition:fade={{ duration: 200 }}
    onclick={(e) => {
      if (e.target === e.currentTarget) closeAdd();
    }}
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add a song"
      transition:scale={{ duration: 200, start: 0.95, easing: cubicOut }}
    >
      <AddSongForm onadd={addSong} oncancel={closeAdd} />
    </div>
  </div>
{/if}
