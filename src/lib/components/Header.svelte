<script lang="ts">
  import add_icon from "#lib/assets/plus-circle-solid.svg";
  import filter_icon from "#lib/assets/filter-solid.svg";

  type Filters = {
    createdAfter: string;
    createdBefore: string;
    lastPlayedAfter: string;
    lastPlayedBefore: string;
    timesPlayedMin: number | undefined;
    timesPlayedMax: number | undefined;
  };

  let {
    showHistory = $bindable(false),
    onAdd,
    searchTerm = $bindable(""),
    filters = $bindable<Filters>({
      createdAfter: "",
      createdBefore: "",
      lastPlayedAfter: "",
      lastPlayedBefore: "",
      timesPlayedMin: undefined,
      timesPlayedMax: undefined,
    }),
  } = $props();

  let filtersOpened = $state(false);

  let activeFilterCount = $derived(
    Object.values(filters).filter(
      (value) => value !== "" && value !== undefined,
    ).length,
  );

  function clearFilters() {
    filters = {
      createdAfter: "",
      createdBefore: "",
      lastPlayedAfter: "",
      lastPlayedBefore: "",
      timesPlayedMin: undefined,
      timesPlayedMax: undefined,
    };
  }
</script>

<header class="z-10 w-full md:w-3/4 lg:w-1/2 mx-auto rounded-lg p-3 sm:p-4">
  <div class="text-white flex flex-col min-w-0">
    <p class="opacity-50 text-sm sm:text-base">Search</p>
    <div class="flex gap-2">
      <input
        class="w-full h-10 bg-transparent text-white rounded-xl"
        bind:value={searchTerm}
      />
      <button
        type="button"
        aria-expanded={filtersOpened}
        aria-controls="song-filters"
        aria-label="Toggle filters"
        onclick={() => (filtersOpened = !filtersOpened)}
        class="relative h-10 w-10 shrink-0 flex items-center justify-center border border-zinc-600 hover:border-white duration-100 rounded-xl"
      >
        <img alt="" class="w-5 h-5" src={filter_icon} />
        {#if activeFilterCount}
          <span
            class="absolute -top-2 -right-2 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-green-700 text-xs text-white"
            >{activeFilterCount}</span
          >
        {/if}
      </button>
    </div>
  </div>

  {#if filtersOpened}
    <div
      id="song-filters"
      class="mt-3 p-3 flex flex-col gap-3 text-white border border-zinc-700 rounded-xl bg-zinc-800"
    >
      <div class="flex items-center justify-between">
        <p class="font-semibold">Filters</p>
        <button
          type="button"
          onclick={clearFilters}
          disabled={!activeFilterCount}
          class="text-sm text-white/60 hover:text-white disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <fieldset class="flex flex-col gap-1">
        <legend class="text-sm text-white/60">Date added</legend>
        <div class="grid grid-cols-2 gap-2">
          <input
            aria-label="Date added from"
            type="date"
            bind:value={filters.createdAfter}
            class="h-10 min-w-0 px-2 bg-zinc-900 rounded-xl"
          />
          <input
            aria-label="Date added to"
            type="date"
            bind:value={filters.createdBefore}
            class="h-10 min-w-0 px-2 bg-zinc-900 rounded-xl"
          />
        </div>
      </fieldset>

      <fieldset class="flex flex-col gap-1">
        <legend class="text-sm text-white/60">Last played</legend>
        <div class="grid grid-cols-2 gap-2">
          <input
            aria-label="Last played from"
            type="date"
            bind:value={filters.lastPlayedAfter}
            class="h-10 min-w-0 px-2 bg-zinc-900 rounded-xl"
          />
          <input
            aria-label="Last played to"
            type="date"
            bind:value={filters.lastPlayedBefore}
            class="h-10 min-w-0 px-2 bg-zinc-900 rounded-xl"
          />
        </div>
      </fieldset>

      <fieldset class="flex flex-col gap-1">
        <legend class="text-sm text-white/60">Times played</legend>
        <div class="grid grid-cols-2 gap-2">
          <input
            aria-label="Minimum times played"
            type="number"
            min="0"
            placeholder="Min"
            bind:value={filters.timesPlayedMin}
            class="h-10 min-w-0 px-2 bg-zinc-900 rounded-xl"
          />
          <input
            aria-label="Maximum times played"
            type="number"
            min="0"
            placeholder="Max"
            bind:value={filters.timesPlayedMax}
            class="h-10 min-w-0 px-2 bg-zinc-900 rounded-xl"
          />
        </div>
      </fieldset>
    </div>
  {/if}

  <div class="w-full mt-2 flex items-center justify-between gap-2">
    <button
      onclick={onAdd}
      class="h-10 shrink-0 flex gap-1 px-3 sm:w-20 justify-center items-center text-white bg-green-700 border border-transparent hover:border-white hover:bg-zinc-800 duration-100 rounded-xl"
    >
      <img alt="add-icon" class="scale-70" src={add_icon} />
      <span>Add</span>
    </button>

    <label
      class="flex items-center gap-2 text-white text-sm cursor-pointer select-none"
    >
      <span class:opacity-50={showHistory}>Songs</span>
      <button
        type="button"
        role="switch"
        aria-checked={showHistory}
        aria-label="Show history"
        onclick={() => (showHistory = !showHistory)}
        class="relative w-11 h-6 rounded-full duration-200 {showHistory
          ? 'bg-green-700'
          : 'bg-zinc-600'}"
      >
        <span
          class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white duration-200 {showHistory
            ? 'translate-x-5'
            : ''}"
        ></span>
      </button>
      <span class:opacity-50={!showHistory}>History</span>
    </label>
  </div>
</header>
