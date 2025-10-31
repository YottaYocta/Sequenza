<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import { evalGradientAt, type Gradient } from "../Adjustment";

  interface Props {
    gradient: Gradient;
    handleUpdateGradient: (newGradient: Gradient) => void;
  }
  const { gradient, handleUpdateGradient }: Props = $props();

  const gradientAttachment: Attachment<HTMLCanvasElement> = (
    element: HTMLCanvasElement
  ) => {
    const ctx = element.getContext("2d");
    if (ctx) {
      for (let i = 0; i < element.width; i++) {
        const currentColor = evalGradientAt(gradient, i / element.width);
        ctx.fillStyle = currentColor;
        ctx.fillRect(i, 0, 1, element.height);
      }
    }
  };
</script>

<div class="flex flex-col">
  <div class="h-24">
    <canvas {@attach gradientAttachment} class="w-full h-16 border"></canvas>
  </div>
  <div class="flex flex-col gap-0 w-full h-min">
    {#each gradient.stops as stop}
      <div class="w-full flex gap-2 items-center">
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={stop.position}
        />
        <p>{stop.color}</p>
      </div>
    {/each}
  </div>
</div>
