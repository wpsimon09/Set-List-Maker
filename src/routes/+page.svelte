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
    last_played: string | null;
    times_played: number;
    played_locked: boolean;
  };

  type SortOption = "name" | "created" | "last-played" | "times-played";

  let showHistory = $state(false);
  let addOpened = $state(false);
  let searchTerm = $state("");
  let sortBy = $state<SortOption>("name");
  let filters = $state({
    createdAfter: "",
    createdBefore: "",
    lastPlayedAfter: "",
    lastPlayedBefore: "",
    timesPlayedMin: undefined,
    timesPlayedMax: undefined,
  });

  let { data } = $props();
  let songs = $state<SongRow[]>(data.songs);

  function matchesSearch(song: SongRow) {
    const query = searchTerm.trim().toLowerCase();
    return (
      !query ||
      song.name.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
    );
  }

  function isDateInRange(
    value: string | null,
    after: string,
    before: string,
  ) {
    if (!after && !before) return true;
    if (!value) return false;

    const date = value.slice(0, 10);
    return (!after || date >= after) && (!before || date <= before);
  }

  function matchesFilters(song: SongRow) {
    return (
      isDateInRange(song.created_at, filters.createdAfter, filters.createdBefore) &&
      isDateInRange(
        song.last_played,
        filters.lastPlayedAfter,
        filters.lastPlayedBefore,
      ) &&
      (filters.timesPlayedMin === undefined ||
        song.times_played >= Number(filters.timesPlayedMin)) &&
      (filters.timesPlayedMax === undefined ||
        song.times_played <= Number(filters.timesPlayedMax))
    );
  }

  function matchesCurrentFilters(song: SongRow) {
    return matchesSearch(song) && matchesFilters(song);
  }

  function sortSongs(list: SongRow[]) {
    return list.sort((a, b) => {
      if (sortBy === "name") {
        return `${a.name} ${a.artist}`.localeCompare(`${b.name} ${b.artist}`);
      }
      if (sortBy === "times-played") return b.times_played - a.times_played;
      if (sortBy === "created") return b.created_at.localeCompare(a.created_at);
      if (!a.last_played && !b.last_played) return 0;
      if (!a.last_played) return 1;
      if (!b.last_played) return -1;
      return b.last_played.localeCompare(a.last_played);
    });
  }

  let setList = $derived(
    sortSongs(
      songs.filter((s) => s.archived_at === null && matchesCurrentFilters(s)),
    ),
  );

  let pastSongs = $derived(
    sortSongs(
      songs.filter((s) => s.archived_at !== null && matchesCurrentFilters(s)),
    ),
  );

  async function updateSong(updated: SongRow) {
    const res = await fetch(`/api/songs/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (!res.ok) return alert("Couldn't save the song. Try again.");
    const saved: SongRow = await res.json();
    songs = songs.map((s) => (s.id === saved.id ? saved : s));
  }

  async function deleteSong(song: SongRow) {
    const res = await fetch(`/api/songs/${song.id}`, { method: "DELETE" });
    if (!res.ok) return alert("Couldn't delete the song. Try again.");
    songs = songs.filter((s) => s.id !== song.id);
  }

  async function markPlayed(song: SongRow) {
    const res = await fetch(`/api/songs/${song.id}/played`, { method: "POST" });
    if (res.status === 409) {
      const current: SongRow = await res.json();
      songs = songs.map((s) => (s.id === current.id ? current : s));
      return alert("This song was already marked as played.");
    }
    if (!res.ok) return alert("Couldn't mark the song as played. Try again.");
    const saved: SongRow = await res.json();
    songs = songs.map((s) => (s.id === saved.id ? saved : s));
  }

  async function allowNextPlay(song: SongRow) {
    const res = await fetch(`/api/songs/${song.id}/played/reset`, {
      method: "POST",
    });
    if (!res.ok) return alert("Couldn't allow the next play. Try again.");
    const saved: SongRow = await res.json();
    songs = songs.map((s) => (s.id === saved.id ? saved : s));
  }

  function archiveSong(song: SongRow) {
    updateSong({ ...song, archived_at: new Date().toISOString() });
  }

  function restoreSong(song: SongRow) {
    updateSong({ ...song, archived_at: null });
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
    <Header
      bind:showHistory
      onAdd={openAdd}
      bind:searchTerm
      bind:filters
      bind:sortBy
    ></Header>
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
        <Song
          {song}
          onsave={updateSong}
          onarchive={archiveSong}
          onplayed={markPlayed}
          onallowNextPlay={allowNextPlay}
        />
      {:else}
        <p class="text-white/50 text-center py-8">
          {songs.length
            ? "No songs match the current search and filters."
            : "No songs yet. Use Add to start your set list."}
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
