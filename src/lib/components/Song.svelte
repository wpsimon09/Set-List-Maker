<script lang="ts">
  import { cubicOut } from "svelte/easing";
  import { fade, scale } from "svelte/transition";

  type SongRow = {
    id: number;
    name: string;
    artist: string;
    tabs_link: string | null;
    created_at: string;
    archived_at: string | null;
    last_played: string | null;
    times_played: number;
  };

  let {
    song,
    onsave = () => {},
    onarchive = () => {},
    onrestore = () => {},
    ondelete = () => {},
    onplayed = () => {},
  }: {
    song: SongRow;
    onsave?: (song: SongRow) => void;
    onarchive?: (song: SongRow) => void;
    onrestore?: (song: SongRow) => void;
    ondelete?: (song: SongRow) => void;
    onplayed?: (song: SongRow) => void;
  } = $props();

  let isArchived = $derived(song.archived_at !== null);

  let editing = $state(false);
  let draft = $state({ name: "", artist: "", tabs_link: "" });

  function startEdit() {
    draft = {
      name: song.name,
      artist: song.artist,
      tabs_link: song.tabs_link ?? "",
    };
    editing = true;
  }

  function save() {
    if (!draft.name.trim() || !draft.artist.trim()) return;
    onsave({
      ...song,
      name: draft.name.trim(),
      artist: draft.artist.trim(),
      tabs_link: draft.tabs_link.trim() || null,
    });
    editing = false;
  }

  function remove() {
    if (confirm(`Delete "${song.name}" for good? This can't be undone.`))
      ondelete(song);
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function playLabel() {
    return song.times_played === 1 ? "1 play" : `${song.times_played} plays`;
  }
</script>

<article
  transition:scale={{ duration: 200, start: 0.95, easing: cubicOut }}
  class="w-full rounded-xl bg-zinc-800 text-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3"
  class:opacity-70={isArchived}
>
  {#if editing}
    <div class="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
      <input
        bind:value={draft.name}
        placeholder="Song name"
        class="h-10 flex-1 min-w-0 px-3 bg-zinc-900 rounded-xl"
      />
      <input
        bind:value={draft.artist}
        placeholder="Artist"
        class="h-10 flex-1 min-w-0 px-3 bg-zinc-900 rounded-xl"
      />
      <input
        bind:value={draft.tabs_link}
        placeholder="Tabs link (optional)"
        type="url"
        class="h-10 flex-1 min-w-0 px-3 bg-zinc-900 rounded-xl"
      />
    </div>

    <div class="flex gap-2 shrink-0">
      <button
        onclick={save}
        class="h-10 px-4 bg-green-700 border border-transparent hover:border-white duration-100 rounded-xl"
      >
        Save
      </button>
      <button
        onclick={() => (editing = false)}
        class="h-10 px-4 border border-zinc-600 hover:border-white duration-100 rounded-xl"
      >
        Cancel
      </button>
    </div>
  {:else}
    <div class="flex-1 min-w-0">
      <p class="font-semibold truncate">{song.name}</p>
      <p class="text-sm opacity-60 truncate">
        {song.artist}
        <span class="opacity-80">
          · {playLabel()}
          {#if song.last_played}
            · last played {formatDate(song.last_played)}
          {/if}
        </span>
        {#if isArchived && song.archived_at}
          <span class="opacity-80">
            · removed {formatDate(song.archived_at)}</span
          >
        {/if}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2 shrink-0">
      {#if song.tabs_link}
        <a
          href={song.tabs_link}
          target="_blank"
          rel="noopener noreferrer"
          class="h-10 px-4 flex items-center border border-zinc-600 hover:border-blue-400 hover:text-blue-400 duration-100 rounded-xl"
        >
          Tabs
        </a>
      {/if}

      {#if isArchived}
        <button
          onclick={() => onrestore(song)}
          class="h-10 px-4 bg-green-700 border border-transparent hover:border-white duration-100 rounded-xl"
        >
          Restore
        </button>
        <button
          onclick={remove}
          class="h-10 px-4 bg-red-800 border border-transparent hover:border-white duration-100 rounded-xl"
        >
          Delete
        </button>
      {:else}
        <button
          onclick={() => onplayed(song)}
          class="h-10 px-4 bg-blue-700 border border-transparent hover:border-white duration-100 rounded-xl"
        >
          Played
        </button>
        <button
          onclick={startEdit}
          class="h-10 px-4 border border-zinc-600 hover:text-yellow-500 hover:border-yellow-500 duration-100 rounded-xl"
        >
          Edit
        </button>
        <button
          onclick={() => onarchive(song)}
          class="h-10 px-4 border border-zinc-600 hover:border-red-500 hover:text-red-400 duration-100 rounded-xl"
        >
          Remove
        </button>
      {/if}
    </div>
  {/if}
</article>
