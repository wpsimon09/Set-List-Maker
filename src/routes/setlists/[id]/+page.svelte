<script lang="ts">
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { goto, invalidateAll } from "$app/navigation";
  import { dragHandle, dragHandleZone, type DndEvent } from "svelte-dnd-action";
  import pentagram from "#lib/assets/pentagram.svg";
  import { formatGigDate } from "#lib/dates.ts";
  import type { SongRow } from "#lib/types.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const flipDurationMs = 150;

  // Local copies that follow the server data but can be changed optimistically
  // (drag and drop, removals). They reset whenever the page data reloads.
  let items = $derived(data.setList.songs);
  let dateDraft = $derived(data.setList.gig_date);

  let pickerOpened = $state(false);
  let searchTerm = $state("");
  let dialog = $state<HTMLDivElement>();

  let inList = $derived(new Set(items.map((s) => s.id)));

  let candidates = $derived.by(() => {
    const query = searchTerm.trim().toLowerCase();
    return data.availableSongs.filter(
      (s) =>
        !inList.has(s.id) &&
        (!query ||
          s.name.toLowerCase().includes(query) ||
          s.artist.toLowerCase().includes(query)),
    );
  });

  onMount(() => dialog?.focus());

  function close() {
    goto("/setlists", { reset: false });
  }

  async function saveDate() {
    if (!dateDraft || dateDraft === data.setList.gig_date) return;
    const res = await fetch(`/api/setlists/${data.setList.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gig_date: dateDraft }),
    });
    if (!res.ok) {
      dateDraft = data.setList.gig_date;
      return alert("Couldn't change the date. Try again.");
    }
    await invalidateAll();
  }

  function handleConsider(e: CustomEvent<DndEvent<SongRow>>) {
    items = e.detail.items;
  }

  async function handleFinalize(e: CustomEvent<DndEvent<SongRow>>) {
    items = e.detail.items;
    const res = await fetch(`/api/setlists/${data.setList.id}/songs`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song_ids: items.map((s) => s.id) }),
    });
    if (!res.ok) alert("Couldn't save the new order. Try again.");
    await invalidateAll();
  }

  async function addSong(song: SongRow) {
    const res = await fetch(`/api/setlists/${data.setList.id}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song_id: song.id }),
    });
    if (!res.ok && res.status !== 409) {
      alert("Couldn't add the song. Try again.");
    }
    await invalidateAll();
  }

  async function removeSong(song: SongRow) {
    items = items.filter((s) => s.id !== song.id);
    const res = await fetch(
      `/api/setlists/${data.setList.id}/songs/${song.id}`,
      { method: "DELETE" },
    );
    if (!res.ok && res.status !== 404) {
      alert("Couldn't remove the song. Try again.");
    }
    await invalidateAll();
  }

  async function markPlayed(song: SongRow) {
    const res = await fetch(`/api/songs/${song.id}/played`, { method: "POST" });
    if (res.status === 409) {
      await invalidateAll();
      return alert("This song was already marked as played.");
    }
    if (!res.ok) return alert("Couldn't mark the song as played. Try again.");
    await invalidateAll();
  }

  async function allowNextPlay(song: SongRow) {
    const res = await fetch(`/api/songs/${song.id}/played/reset`, {
      method: "POST",
    });
    if (!res.ok) return alert("Couldn't allow the next play. Try again.");
    await invalidateAll();
  }

  function playLabel(song: SongRow) {
    return song.times_played === 1 ? "1 play" : `${song.times_played} plays`;
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") close();
  }}
/>

<svelte:head>
  <title>Set list · {formatGigDate(data.setList.gig_date)}</title>
</svelte:head>

<div
  role="presentation"
  onclick={(e) => {
    if (e.target === e.currentTarget) close();
  }}
  class="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
>
  <div
    bind:this={dialog}
    role="dialog"
    aria-modal="true"
    aria-labelledby="setlist-title"
    tabindex="-1"
    style:view-transition-name="setlist-{data.setList.id}"
    style:view-transition-class="setlist"
    class="w-[min(40rem,100%)] max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-800 text-white border border-white/10 shadow-2xl outline-none"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col gap-1 min-w-0">
        <h2 id="setlist-title" class="text-xl font-semibold">
          {formatGigDate(data.setList.gig_date, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h2>
        <label class="flex items-center gap-2 text-sm text-white/60">
          <span>Date</span>
          <input
            type="date"
            bind:value={dateDraft}
            onchange={saveDate}
            class="h-9 px-2 bg-zinc-900 text-white rounded-lg"
          />
        </label>
      </div>
      <a
        href="/setlists"
        data-sveltekit-reset="false"
        aria-label="Close"
        class="h-10 w-10 shrink-0 flex items-center justify-center border border-zinc-600 hover:border-white duration-100 rounded-xl"
      >
        ✕
      </a>
    </div>

    <p class="text-sm text-white/50">
      {items.length === 1 ? "1 song" : `${items.length} songs`}
      {#if items.length > 1}· drag ⠿ to reorder{/if}
    </p>

    {#if items.length === 0}
      <p class="text-white/50 text-center py-6">
        No songs yet. Use Add songs below.
      </p>
    {/if}

    <ol
      use:dragHandleZone={{ items, flipDurationMs, dropTargetStyle: {} }}
      onconsider={handleConsider}
      onfinalize={handleFinalize}
      class="flex flex-col gap-2"
    >
      {#each items as song, i (song.id)}
        <li
          animate:flip={{ duration: flipDurationMs }}
          class="rounded-xl bg-zinc-900 p-3 flex flex-wrap items-center gap-3"
          class:opacity-70={song.archived_at !== null}
        >
          <div
            use:dragHandle
            aria-label="Drag to reorder {song.name}"
            class="h-10 w-8 shrink-0 flex items-center justify-center text-xl text-white/50 hover:text-white cursor-grab touch-none select-none"
          >
            ⠿
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1">
              <span class="text-white/40 text-sm w-6 shrink-0">{i + 1}.</span>
              <img alt="" src={pentagram} class="w-5 h-5" />
              <p class="font-semibold truncate">{song.name}</p>
              {#if song.archived_at !== null}
                <span
                  class="ml-1 shrink-0 px-2 py-0.5 text-xs rounded-full border border-white/30 text-white/70"
                >
                  Archived
                </span>
              {/if}
            </div>
            <p class="text-sm opacity-60 truncate">
              {song.artist} · {playLabel(song)}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            {#if song.tabs_link}
              <a
                href={song.tabs_link}
                target="_blank"
                rel="noopener noreferrer"
                class="h-10 px-3 flex items-center border border-zinc-600 hover:border-blue-400 hover:text-blue-400 duration-100 rounded-xl"
              >
                Tabs
              </a>
            {/if}
            {#if song.archived_at === null}
              {#if song.played_locked}
                <button
                  type="button"
                  onclick={() => allowNextPlay(song)}
                  title="Unlock this song so the group can record its next play"
                  class="h-10 px-3 bg-zinc-700 border border-transparent hover:border-white duration-100 rounded-xl"
                >
                  Unlock
                </button>
              {:else}
                <button
                  type="button"
                  onclick={() => markPlayed(song)}
                  class="h-10 px-3 bg-blue-700 border border-transparent hover:border-white duration-100 rounded-xl"
                >
                  Played
                </button>
              {/if}
            {/if}
            <button
              type="button"
              onclick={() => removeSong(song)}
              aria-label="Remove {song.name} from this set list"
              class="h-10 w-10 flex items-center justify-center border border-zinc-600 hover:border-red-500 hover:text-red-400 duration-100 rounded-xl"
            >
              ✕
            </button>
          </div>
        </li>
      {/each}
    </ol>

    <div class="border-t border-white/10 pt-4 flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={pickerOpened}
        aria-controls="song-picker"
        onclick={() => (pickerOpened = !pickerOpened)}
        class="h-10 self-start px-4 bg-green-700 border border-transparent hover:border-white duration-100 rounded-xl"
      >
        {pickerOpened ? "Done adding" : "Add songs"}
      </button>

      {#if pickerOpened}
        <div id="song-picker" class="flex flex-col gap-2">
          <input
            bind:value={searchTerm}
            placeholder="Search songs or artists"
            aria-label="Search songs to add"
            class="h-10 px-3 bg-zinc-900 text-white rounded-xl"
          />
          {#each candidates as song (song.id)}
            <div
              class="rounded-xl bg-zinc-900/60 px-3 py-2 flex items-center gap-3"
            >
              <div class="flex-1 min-w-0">
                <p class="font-semibold truncate">{song.name}</p>
                <p class="text-sm opacity-60 truncate">{song.artist}</p>
              </div>
              <button
                type="button"
                onclick={() => addSong(song)}
                class="h-9 px-3 shrink-0 bg-green-700 border border-transparent hover:border-white duration-100 rounded-lg"
              >
                Add
              </button>
            </div>
          {:else}
            <p class="text-sm text-white/50 text-center py-3">
              {data.availableSongs.length === 0
                ? "There are no active songs in the main list."
                : searchTerm.trim()
                  ? "No songs match your search."
                  : "Every active song is already in this set list."}
            </p>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
