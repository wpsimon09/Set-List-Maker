<script lang="ts">
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
    onadd = () => {},
    oncancel = () => {},
  }: {
    onadd?: (song: SongRow) => void;
    oncancel?: () => void;
  } = $props();

  let name = $state("");
  let artist = $state("");
  let tabsLink = $state("");
  let saving = $state(false);
  let errorMessage = $state("");

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!name.trim() || !artist.trim()) {
      errorMessage = "Song name and artist are required.";
      return;
    }

    saving = true;
    errorMessage = "";

    try {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          artist: artist.trim(),
          tabs_link: tabsLink.trim() || null,
        }),
      });

      if (!res.ok) throw new Error();
      onadd(await res.json());
    } catch {
      errorMessage =
        "Couldn't add the song. Check your connection and try again.";
    } finally {
      saving = false;
    }
  }
</script>

<form
  onsubmit={submit}
  class="w-[min(28rem,calc(100vw-2rem))] flex flex-col gap-4 p-5 rounded-2xl bg-zinc-800 text-white border border-white/10 shadow-2xl"
>
  <h2 class="text-xl font-semibold">Add a song</h2>

  <label class="flex flex-col gap-1">
    <span class="text-sm opacity-60">Song name</span>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      bind:value={name}
      required
      autofocus
      class="h-10 px-3 bg-zinc-900 rounded-xl"
    />
  </label>

  <label class="flex flex-col gap-1">
    <span class="text-sm opacity-60">Artist</span>
    <input
      bind:value={artist}
      required
      class="h-10 px-3 bg-zinc-900 rounded-xl"
    />
  </label>

  <label class="flex flex-col gap-1">
    <span class="text-sm opacity-60">Tabs link (optional)</span>
    <input
      bind:value={tabsLink}
      type="url"
      placeholder="https://"
      class="h-10 px-3 bg-zinc-900 rounded-xl"
    />
  </label>

  {#if errorMessage}
    <p class="text-sm text-red-400">{errorMessage}</p>
  {/if}

  <div class="flex justify-end gap-2 mt-2">
    <button
      type="button"
      onclick={oncancel}
      class="h-10 px-4 border border-zinc-600 hover:border-white duration-100 rounded-xl"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={saving}
      class="h-10 px-4 bg-green-700 border border-transparent hover:border-white duration-100 rounded-xl disabled:opacity-50"
    >
      {saving ? "Adding…" : "Add song"}
    </button>
  </div>
</form>
