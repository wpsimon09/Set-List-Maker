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
  // Song whose actions menu is open (mobile only), or null.
  let openMenuId = $state<number | null>(null);

  function toggleMenu(song: SongRow) {
    openMenuId = openMenuId === song.id ? null : song.id;
  }

  /** True when `next` holds exactly the songs of `prev`, each once. */
  function isSameSongs(prev: SongRow[], next: SongRow[]) {
    if (prev.length !== next.length) return false;
    const ids = new Set(next.map((s) => s.id));
    return ids.size === next.length && prev.every((s) => ids.has(s.id));
  }

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
    openMenuId = null;
    items = e.detail.items;
  }

  async function handleFinalize(e: CustomEvent<DndEvent<SongRow>>) {
    const next = e.detail.items;
    // Only save a real reordering of this set list's songs. Anything else
    // (lost, duplicated or foreign items) is discarded and the list reloads.
    if (!isSameSongs(data.setList.songs, next)) {
      items = data.setList.songs;
      return invalidateAll();
    }
    items = next;
    const unchanged = next.every((s, i) => s.id === data.setList.songs[i].id);
    if (unchanged) return;
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
    if (e.key !== "Escape") return;
    if (openMenuId !== null) openMenuId = null;
    else close();
  }}
  onclick={(e) => {
    if (
      openMenuId !== null &&
      !(e.target as Element).closest?.("[data-song-menu]")
    ) {
      openMenuId = null;
    }
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
      use:dragHandleZone={{
        items,
        flipDurationMs,
        dropTargetStyle: {},
        // Unique type: only this list's songs can be dropped into it.
        type: `setlist-${data.setList.id}`,
      }}
      onconsider={handleConsider}
      onfinalize={handleFinalize}
      class="flex flex-col gap-2"
    >
      {#each items as song, i (song.id)}
        <li
          animate:flip={{ duration: flipDurationMs }}
          class="relative rounded-xl bg-zinc-900 p-2 sm:p-3 flex items-center gap-2 sm:gap-3 sm:flex-wrap"
          class:z-10={openMenuId === song.id}
          class:opacity-70={song.archived_at !== null}
        >
          <div
            use:dragHandle
            aria-label="Drag to reorder {song.name}"
            class="h-10 w-6 sm:w-8 shrink-0 flex items-center justify-center text-lg sm:text-xl text-white/50 hover:text-white cursor-grab touch-none select-none"
          >
            ⠿
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1">
              <span class="text-white/40 text-xs sm:text-sm w-5 sm:w-6 shrink-0"
                >{i + 1}.</span
              >
              <img alt="" src={pentagram} class="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <p class="text-sm sm:text-base font-semibold truncate">
                {song.name}
              </p>
              {#if song.archived_at !== null}
                <span
                  class="ml-1 shrink-0 px-1.5 sm:px-2 py-0.5 text-[0.65rem] sm:text-xs rounded-full border border-white/30 text-white/70"
                >
                  Archived
                </span>
              {/if}
            </div>
            <p class="text-xs sm:text-sm opacity-60 truncate">
              {song.artist} · {playLabel(song)}
            </p>
          </div>

          <!-- Mobile: actions live in a dropdown so the title gets the room. -->
          <div data-song-menu class="relative shrink-0 sm:hidden">
            <button
              type="button"
              onclick={() => toggleMenu(song)}
              aria-label="Actions for {song.name}"
              aria-haspopup="menu"
              aria-expanded={openMenuId === song.id}
              class="h-10 w-10 flex items-center justify-center text-xl border border-zinc-600 hover:border-white duration-100 rounded-xl"
            >
              ⋯
            </button>
            {#if openMenuId === song.id}
              <div
                role="menu"
                class="absolute right-0 top-full mt-1 w-40 flex flex-col p-1 rounded-xl bg-zinc-700 border border-white/10 shadow-xl text-sm"
              >
                {#if song.tabs_link}
                  <a
                    role="menuitem"
                    href={song.tabs_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onclick={() => (openMenuId = null)}
                    class="px-3 py-2 rounded-lg hover:bg-zinc-600 text-blue-300"
                  >
                    Tabs
                  </a>
                {/if}
                {#if song.archived_at === null}
                  {#if song.played_locked}
                    <button
                      type="button"
                      role="menuitem"
                      onclick={() => {
                        openMenuId = null;
                        allowNextPlay(song);
                      }}
                      class="px-3 py-2 text-left rounded-lg hover:bg-zinc-600"
                    >
                      Unlock
                    </button>
                  {:else}
                    <button
                      type="button"
                      role="menuitem"
                      onclick={() => {
                        openMenuId = null;
                        markPlayed(song);
                      }}
                      class="px-3 py-2 text-left rounded-lg hover:bg-zinc-600"
                    >
                      Played
                    </button>
                  {/if}
                {/if}
                <button
                  type="button"
                  role="menuitem"
                  onclick={() => {
                    openMenuId = null;
                    removeSong(song);
                  }}
                  class="px-3 py-2 text-left rounded-lg hover:bg-zinc-600 text-red-400"
                >
                  Remove
                </button>
              </div>
            {/if}
          </div>

          <div class="hidden sm:flex flex-wrap items-center gap-2 shrink-0">
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
