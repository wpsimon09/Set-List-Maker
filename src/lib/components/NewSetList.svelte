<script lang="ts">
  import type { SetListSummary } from "#lib/types.ts";
  import { formatGigDate, todayISO } from "#lib/dates.ts";

  let {
    setLists,
    oncreated = () => {},
    oncancel = () => {},
  }: {
    setLists: SetListSummary[];
    oncreated?: (id: number) => void;
    oncancel?: () => void;
  } = $props();

  let gigDate = $state(todayISO());
  let copyFrom = $state("");
  let saving = $state(false);
  let errorMessage = $state("");

  // Newest gigs first, so the most recent set list is easy to copy.
  let copyOptions = $derived(
    [...setLists].sort((a, b) => b.gig_date.localeCompare(a.gig_date)),
  );

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!gigDate) {
      errorMessage = "Pick a date for the gig.";
      return;
    }

    saving = true;
    errorMessage = "";

    try {
      const res = await fetch("/api/setlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gig_date: gigDate,
          copy_from: copyFrom ? Number(copyFrom) : null,
        }),
      });

      if (!res.ok) throw new Error();
      const created: { id: number } = await res.json();
      oncreated(created.id);
    } catch {
      errorMessage =
        "Couldn't create the set list. Check your connection and try again.";
    } finally {
      saving = false;
    }
  }
</script>

<form
  onsubmit={submit}
  class="w-[min(28rem,calc(100vw-2rem))] flex flex-col gap-4 p-5 rounded-2xl bg-zinc-800 text-white border border-white/10 shadow-2xl"
>
  <h2 class="text-xl font-semibold">New set list</h2>

  <label class="flex flex-col gap-1">
    <span class="text-sm opacity-60">Gig date</span>
    <input
      bind:value={gigDate}
      type="date"
      required
      class="h-10 px-3 bg-zinc-900 rounded-xl"
    />
  </label>

  <label class="flex flex-col gap-1">
    <span class="text-sm opacity-60">Copy songs from (optional)</span>
    <select
      bind:value={copyFrom}
      disabled={copyOptions.length === 0}
      class="h-10 px-2 bg-zinc-900 rounded-xl hover:cursor-pointer disabled:opacity-50"
    >
      <option value="">Start empty</option>
      {#each copyOptions as option (option.id)}
        <option value={String(option.id)}>
          {formatGigDate(option.gig_date)} · {option.song_count}
          {option.song_count === 1 ? "song" : "songs"}
        </option>
      {/each}
    </select>
    {#if copyFrom}
      <span class="text-xs text-white/50">
        Archived songs aren't copied.
      </span>
    {/if}
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
      {saving ? "Creating…" : "Create"}
    </button>
  </div>
</form>
