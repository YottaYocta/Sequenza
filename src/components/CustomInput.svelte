<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import NumericalInput from "./NumericalInput.svelte";

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

  function startDrag(track: HTMLDivElement, e: MouseEvent) {
    const update = (clientX: number) => {
      const rect = track.getBoundingClientRect();
      let ratio = (clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      const newVal = Math.round((min + ratio * (max - min)) / step) * step;
      handleUpdate(newVal);
    };

    update(e.clientX);

    const handleMouseMove = (e: MouseEvent) => update(e.clientX);
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
      startDrag(track, e);
    };
    thumb.addEventListener("mousedown", handleMouseDown);
    return () => thumb.removeEventListener("mousedown", handleMouseDown);
  };

  function handleTrackMouseDown(e: MouseEvent) {
    const track = e.currentTarget as HTMLDivElement;
    startDrag(track, e);
  }

  function resetValue() {
    handleUpdate(defaultValue);
  }
</script>

<div class="flex items-center gap-2">
  <label class="w-full text-right text-nowrap" for={label}>{label}</label>

  <NumericalInput
    name={label}
    {min}
    {max}
    {step}
    {value}
    handleValueChanged={handleUpdate}
  ></NumericalInput>

  <div
    class="relative w-56 min-w-16 h-3 border border-black cursor-pointer border-l-2 border-r-2 bg-white"
    onmousedown={handleTrackMouseDown}
    role="slider"
    aria-valuenow={value}
    tabindex="0"
  >
    <div
      {@attach thumbDrag}
      class="absolute top-0 h-full w-2 bg-black -translate-x-1/2"
      style="left: {((value - min) / (max - min)) * 100}%;"
    ></div>
  </div>

  {#if value !== defaultValue}
    <button
      class="min-w-8 flex items-center"
      onclick={resetValue}
      aria-label="Reset"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="M10 11H7.101l.001-.009a5 5 0 0 1 .752-1.787a5.05 5.05 0 0 1 2.2-1.811q.455-.193.938-.291a5.1 5.1 0 0 1 2.018 0a5 5 0 0 1 2.525 1.361l1.416-1.412a7 7 0 0 0-2.224-1.501a7 7 0 0 0-1.315-.408a7.1 7.1 0 0 0-2.819 0a7 7 0 0 0-1.316.409a7.04 7.04 0 0 0-3.08 2.534a7 7 0 0 0-1.054 2.505c-.028.135-.043.273-.063.41H2l4 4zm4 2h2.899l-.001.008a4.98 4.98 0 0 1-2.103 3.138a4.9 4.9 0 0 1-1.787.752a5.1 5.1 0 0 1-2.017 0a5 5 0 0 1-1.787-.752a5 5 0 0 1-.74-.61L7.05 16.95a7 7 0 0 0 2.225 1.5c.424.18.867.317 1.315.408a7.1 7.1 0 0 0 2.818 0a7.03 7.03 0 0 0 4.395-2.945a7 7 0 0 0 1.053-2.503c.027-.135.043-.273.063-.41H22l-4-4z"
        /></svg
      ></button
    >
  {:else}
    <span class="min-w-8 h-1"></span>
  {/if}
</div>
