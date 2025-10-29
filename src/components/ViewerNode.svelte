<script lang="ts">
  import type { Output } from "../ProcessingNode";

  const { output } = $props<{
    output?: Output;
  }>();

  let canvasRef: HTMLCanvasElement | undefined = $state();

  // Draw image data to canvas when output changes
  $effect(() => {
    if (output && output.type === "image" && canvasRef) {
      const ctx = canvasRef.getContext("2d");
      if (ctx) {
        canvasRef.width = output.data.width;
        canvasRef.height = output.data.height;
        ctx.putImageData(output.data, 0, 0);
      }
    }
  });

  async function copyToClipboard() {
    if (!output) return;

    if (output.type === "image" && canvasRef) {
      try {
        canvasRef.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
          }
        });
      } catch (err) {
        console.error("Failed to copy image:", err);
      }
    } else if (output.type === "svg") {
      try {
        await navigator.clipboard.writeText(output.data);
      } catch (err) {
        console.error("Failed to copy SVG:", err);
      }
    }
  }

  function saveFile() {
    if (!output) return;

    if (output.type === "image" && canvasRef) {
      canvasRef.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "image.png";
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } else if (output.type === "svg") {
      const blob = new Blob([output.data], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.svg";
      a.click();
      URL.revokeObjectURL(url);
    }
  }
</script>

<div
  class="w-72 h-72 flex flex-col gap-1 items-start justify-center rounded-tr-3xl p-2 border bg-neutral-50"
>
  {#if !output}
    <p class="text-neutral-500 text-sm">No input</p>
  {:else if output.type === "image"}
    <div class="w-full justify-start items-center flex gap-2">
      <button
        onclick={copyToClipboard}
        class=" text-sm hover:bg-neutral-100 transition"
      >
        Copy Image
      </button>
      <button
        onclick={saveFile}
        class=" text-sm hover:bg-neutral-100 transition"
      >
        Save Image
      </button>
    </div>
    <canvas bind:this={canvasRef} class="max-w-full h-auto"></canvas>
  {:else if output.type === "svg"}
    <div class="flex gap-2">
      <button
        onclick={copyToClipboard}
        class=" text-sm hover:bg-neutral-100 transition"
      >
        Copy SVG
      </button>
      <button
        onclick={saveFile}
        class=" text-sm hover:bg-neutral-100 transition"
      >
        Save SVG
      </button>
    </div>

    <div class="w-full max-w-full p-2">
      {@html output.data}
    </div>
  {/if}
</div>
