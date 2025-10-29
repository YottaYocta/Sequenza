<script lang="ts">
  import type { Attachment } from "svelte/attachments";

  const {
    min = 0,
    max = 100,
    step = 1,
    defaultValue = 50,
    handleUpdate = () => {},
    value,
    label,
  }: {
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
    handleUpdate: (newValue: number) => void;
    value: number;
    label: string;
  } = $props();

  let inputValue = $state(String(value));

  type DragState = { startX: number } | null;

  function updateFromInput() {
    const floatRegex = /^-?\d+(\.\d+)?$/;

    if (floatRegex.test(inputValue)) {
      const num = parseFloat(inputValue);
      if (num >= min && num <= max) {
        handleUpdate(num);
        return;
      }
    }

    // Fallback if invalid
    inputValue = String(value);
  }

  function startDrag(track: HTMLDivElement) {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = track.getBoundingClientRect();
      let ratio = (e.clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      const newVal = Math.round((min + ratio * (max - min)) / step) * step;
      handleUpdate(newVal);
      inputValue = String(newVal);
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  const thumbDrag: Attachment<HTMLDivElement> = (thumb) => {
    const track = thumb.parentElement as HTMLDivElement;
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      startDrag(track);
    };
    thumb.addEventListener("mousedown", handleMouseDown);
    return () => thumb.removeEventListener("mousedown", handleMouseDown);
  };

  function handleTrackMouseDown(e: MouseEvent) {
    const track = e.currentTarget as HTMLDivElement;
    startDrag(track);
  }

  function resetValue() {
    handleUpdate(defaultValue);
    inputValue = String(defaultValue);
  }
</script>

<div class="flex items-center gap-2">
  <label class="w-36 text-right">{label}</label>

  <input
    class="w-8 custom-number-input outline-none focus:bg-black focus:text-white"
    bind:value={inputValue}
    onkeydown={(e) => e.key === "Enter" && updateFromInput()}
  />

  <div
    class="relative w-48 h-4 border border-black bg-gray-100 cursor-pointer"
    onmousedown={handleTrackMouseDown}
  >
    <div
      {@attach thumbDrag}
      class="absolute top-0 h-full w-2 bg-black -translate-x-1/2"
      style="left: {((value - min) / (max - min)) * 100}%;"
    ></div>
  </div>

  {#if value !== defaultValue}
    <button
      class="w-4 h-4 rounded-full bg-black"
      onclick={resetValue}
      aria-label="Reset"
    ></button>
  {/if}
</div>
