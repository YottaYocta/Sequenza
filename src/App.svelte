<script lang="ts">
  import svelteLogo from "./assets/svelte.svg";
  import viteLogo from "/vite.svg";
  import Counter from "./lib/Counter.svelte";
</script>

<main
  class="w-screen overflow-x-hidden h-screen overflow-y-hidden bg-neutral-200 flex flex-row gap-8 p-16 justify-center items-stretch text-neutral-600"
>
  <div
    class="w-full h-full bg-neutral-100 border border-neutral-50 rounded-sm flex flex-col p-4 gap-4"
  >
    <canvas class="w-full h-full bg-blue-600"></canvas>
    <div class="w-full p-4 flex gap-4 h-24">
      <div class="w-36">
        <label for="hue">Hue</label>
        <input
          class="w-full"
          type="range"
          min="0"
          max="1"
          name="hue"
          defaultValue="0.5"
          step="0.01"
        />
      </div>
      <div class="w-36">
        <label for="hue">Saturation</label>
        <input
          class="w-full"
          type="range"
          min="0"
          max="1"
          name="Saturation"
          defaultValue="0.5"
          step="0.01"
        />
      </div>
      <div class="w-36">
        <label for="hue">Value</label>
        <input
          class="w-full"
          type="range"
          min="0"
          max="1"
          name="Value"
          defaultValue="0.5"
          step="0.01"
        />
      </div>
    </div>
  </div>
  <div
    class="w-full h-full bg-neutral-100 border border-neutral-50 rounded-sm flex flex-col p-4 gap-4"
  >
    <svg class="w-full h-full bg-blue-600"></svg>
    <div class="h-24 w-full flex flex-col gap-4">
      <p>Effects</p>
      <ul class="flex gap-4">
        <!-- make selection; selecting one of these will affect what is rendered -->
        <li>Dots</li>
        <li>Pixels</li>
        <li>Dither</li>
      </ul>
    </div>
  </div>
</main>
