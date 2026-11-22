<script lang="ts">
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { goto, invalidateAll, onNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import NewSetList from "#lib/components/NewSetList.svelte";
  import cross from "#lib/assets/cross.svg";
  import trash from "#lib/assets/trash-solid.svg";
  import { formatGigDate, todayISO } from "#lib/dates.ts";
  import type { SetListSummary } from "#lib/types.ts";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  let today = $state(todayISO());
  let createOpened = $state(false);
  let confirmDeleteId = $state<number | null>(null);

  // The set list whose overview is open. Its tile drops its
  // view-transition-name so only the dialog carries it (names must be unique).
  let openId = $derived(page.params.id ? Number(page.params.id) : null);

  let upcoming = $derived(
    data.setLists
      .filter((s) => s.gig_date >= today)
      .sort((a, b) => a.gig_date.localeCompare(b.gig_date) || a.id - b.id),
  );

  let past = $derived(
    data.setLists
      .filter((s) => s.gig_date < today)
      .sort((a, b) => b.gig_date.localeCompare(a.gig_date) || b.id - a.id),
  );

  onMount(() => {
    // The server renders with its own timezone; correct "today" for the viewer.
    today = todayISO();
  });

  // Morph the tile into the overview dialog (and back) where supported.
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  async function deleteSetList(setList: SetListSummary) {
    const res = await fetch(`/api/setlists/${setList.id}`, {
      method: "DELETE",
    });
    confirmDeleteId = null;
    if (!res.ok) return alert("Couldn't delete the set list. Try again.");
    await invalidateAll();
  }

  async function created(id: number) {
    createOpened = false;
    await goto(`/setlists/${id}`, { invalidateAll: true, reset: false });
  }

  function songCountLabel(count: number) {
    return count === 1 ? "1 song" : `${count} songs`;
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key !== "Escape") return;
    if (createOpened) createOpened = false;
    else if (confirmDeleteId !== null) confirmDeleteId = null;
  }}
/>

<svelte:head>
  <title>Set lists</title>
</svelte:head>

{#snippet tile(setList: SetListSummary, isPast: boolean)}
  <li
    class="relative rounded-xl bg-zinc-800 text-white border border-white/10 hover:border-white/40 duration-100"
    class:opacity-80={isPast}
    class:grayscale={isPast}
    style:view-transition-name={openId === setList.id
      ? "none"
      : `setlist-${setList.id}`}
    style:view-transition-class="setlist"
  >
    <a
      href="/setlists/{setList.id}"
      data-sveltekit-reset="false"
      class="block p-4 pr-14 rounded-xl"
    >
      <p class="text-xs uppercase tracking-wider text-white/50">
        {isPast ? "Played" : "Upcoming"}
      </p>
      <p class="text-lg font-semibold">{formatGigDate(setList.gig_date)}</p>
      <p class="text-sm text-white/60">{songCountLabel(setList.song_count)}</p>
      {#if setList.preview.length}
        <ul class="mt-2 text-sm text-white/70 flex flex-col gap-0.5">
          {#each setList.preview as name, i (i)}
            <li class="truncate">{i + 1}. {name}</li>
          {/each}
          {#if setList.song_count > setList.preview.length}
            <li class="text-white/40">
              +{setList.song_count - setList.preview.length} more
            </li>
          {/if}
        </ul>
      {:else}
        <p class="mt-2 text-sm text-white/40">No songs yet</p>
      {/if}
    </a>

    <div class="absolute top-3 right-3 flex items-center gap-1">
      {#if confirmDeleteId === setList.id}
        <span class="text-sm text-white/70 mr-1">Delete?</span>
        <button
          type="button"
          onclick={() => deleteSetList(setList)}
          class="h-8 px-3 text-sm bg-red-800 border border-transparent hover:border-white duration-100 rounded-lg"
        >
          Yes
        </button>
        <button
          type="button"
          onclick={() => (confirmDeleteId = null)}
          class="h-8 px-3 text-sm border border-zinc-600 hover:border-white duration-100 rounded-lg"
        >
          No
        </button>
      {:else}
        <button
          type="button"
          aria-label="Delete set list for {formatGigDate(setList.gig_date)}"
          onclick={() => (confirmDeleteId = setList.id)}
          class="h-8 w-8 flex items-center justify-center border border-zinc-600 hover:border-red-500 duration-100 rounded-lg"
        >
          <img alt="" src={trash} class="w-4 h-4 opacity-70" />
        </button>
      {/if}
    </div>
  </li>
{/snippet}

<main class="w-full min-h-screen flex flex-col items-center bg-zinc-900">
  <div class="w-full flex flex-row items-center justify-center">
    <img
      alt="cross"
      src={cross}
      class="lg:w-20 w-15 h-15 opacity-40 rotate-180 mt-4"
    />
    <h1
      class="font-bloodra tracking-wider text-5xl lg:text-8xl text-white opacity-50 mx-4 mt-2 lg:mt-4"
    >
      Set Lists
    </h1>
    <img
      alt="cross"
      src={cross}
      class="lg:w-20 w-15 h-15 opacity-40 rotate-180 mt-4"
    />
  </div>

  <div
    class="w-full sticky top-0 z-20 flex flex-col items-center p-1 bg-zinc-900 border-b border-white/20 rounded-b-lg shadow-2xl"
  >
    <div
      class="w-full md:w-3/4 lg:w-1/2 p-3 sm:p-4 flex items-center justify-between gap-2"
    >
      <a
        href="/"
        class="h-10 px-3 flex items-center text-white border border-zinc-600 hover:border-white duration-100 rounded-xl"
      >
        ← All songs
      </a>
      <button
        type="button"
        onclick={() => (createOpened = true)}
        class="h-10 px-4 text-white bg-green-700 border border-transparent hover:border-white duration-100 rounded-xl"
      >
        New set list
      </button>
    </div>
  </div>

  <section class="w-full md:w-3/4 lg:w-1/2 flex-1 flex flex-col gap-6 p-3 sm:p-4">
    {#if data.setLists.length === 0}
      <p class="text-white/50 text-center py-8">
        No set lists yet. Use New set list to plan a gig.
      </p>
    {/if}

    {#if upcoming.length}
      <div class="flex flex-col gap-2">
        <h2 class="text-sm uppercase tracking-wider text-white/50">Upcoming</h2>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each upcoming as setList (setList.id)}
            {@render tile(setList, false)}
          {/each}
        </ul>
      </div>
    {/if}

    {#if past.length}
      <div class="flex flex-col gap-2">
        <h2 class="text-sm uppercase tracking-wider text-white/50">Past</h2>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each past as setList (setList.id)}
            {@render tile(setList, true)}
          {/each}
        </ul>
      </div>
    {/if}
  </section>
</main>

{@render children()}

{#if createOpened}
  <div
    role="presentation"
    transition:fade={{ duration: 200 }}
    onclick={(e) => {
      if (e.target === e.currentTarget) createOpened = false;
    }}
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New set list"
      transition:scale={{ duration: 200, start: 0.95, easing: cubicOut }}
    >
      <NewSetList
        setLists={data.setLists}
        oncreated={created}
        oncancel={() => (createOpened = false)}
      />
    </div>
  </div>
{/if}
