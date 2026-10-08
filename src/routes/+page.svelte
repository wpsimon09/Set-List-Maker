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
  let searchTerm = $state("");

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

  let setList = $derived(
    songs.filter((s) => s.archived_at === null && matchesSearch(s)),
  );

  let pastSongs = $derived(
    songs
      .filter((s) => s.archived_at !== null && matchesSearch(s))
      .sort((a, b) => b.archived_at!.localeCompare(a.archived_at!)),
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
    <Header bind:showHistory onAdd={openAdd} bind:searchTerm></Header>
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
