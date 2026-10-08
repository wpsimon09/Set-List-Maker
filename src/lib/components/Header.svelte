<script>
  import add_icon from "#lib/assets/plus-circle-solid.svg";

  let {
    showHistory = $bindable(false),
    onAdd,
    searchTerm = $bindable(true),
  } = $props();
</script>

<header class="z-10 w-full md:w-3/4 lg:w-1/2 mx-auto rounded-lg p-3 sm:p-4">
  <div class="text-white flex flex-col min-w-0">
    <p class="opacity-50 text-sm sm:text-base">Search</p>
    <input
      class="w-full h-10 bg-transparent text-white rounded-xl"
      bind:value={searchTerm}
    />
  </div>

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
