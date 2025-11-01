<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import { evalGradientAt, type Gradient } from "../Adjustment";
  import NumericalInput from "./NumericalInput.svelte";

  interface Props {
    gradient: Gradient;
    handleUpdateGradient: (newGradient: Gradient) => void;
  }
  const { gradient, handleUpdateGradient }: Props = $props();
  const displayGradient: Gradient = $derived({
    ...gradient,
  });

  const gradientAttachment: Attachment<HTMLCanvasElement> = (
    element: HTMLCanvasElement
  ) => {
    const ctx = element.getContext("2d");
    if (ctx) {
      for (let i = 0; i < element.width; i++) {
        const currentColor = evalGradientAt(displayGradient, i / element.width);
        ctx.fillStyle = currentColor;
        ctx.fillRect(i, 0, 1, element.height);
      }
    }
  };
</script>

<div class="flex flex-col justify-center items-center gap-2 text-sm">
  <div class="h-8">
    <div class="w-min h-min relative">
      <canvas {@attach gradientAttachment} class="w-32 h-4 border"> </canvas>
      {#each displayGradient.stops as stop, idx}
        <button
          aria-label={`handle for stop ${idx}`}
          class="w-4 h-2 -translate-x-1/2 border absolute -bottom-3"
          style={`left: ${stop.position * 100}%; background: ${stop.color}; `}
        >
        </button>
      {/each}
    </div>
  </div>
  <div class="w-full flex justify-between">
    <p>STOPS</p>
    <button
      class="button-1"
      onclick={() => {
        displayGradient.stops.push({
          position: 1,
          color: "#ffffff",
        });
        handleUpdateGradient(displayGradient);
      }}>ADD +</button
    >
  </div>
  <div class="flex flex-col gap-0 w-full h-min">
    {#each displayGradient.stops as stop, idx}
      <div class="w-full flex gap-2 items-center h-min">
        <NumericalInput
          min={0}
          max={1}
          step={0.01}
          value={stop.position}
          name={`stop-${idx}`}
          handleValueChanged={(newValue) => {
            displayGradient.stops[idx].position = newValue;
            handleUpdateGradient(displayGradient);
          }}
        ></NumericalInput>
        <input
          type="color"
          aria-label={`open-color-picker-for-stop-${idx}`}
          class="w-4 h-4 border"
          value={stop.color}
          onchange={(inputEvent) => {
            displayGradient.stops[idx].color = inputEvent.currentTarget.value;
            handleUpdateGradient(displayGradient);
          }}
        />
        <p>{stop.color}</p>
      </div>
    {/each}
  </div>
</div>
