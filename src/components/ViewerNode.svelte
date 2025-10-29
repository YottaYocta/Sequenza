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
    } else if (output && output.type === "svg") {
      console.log("SVG output:", output.data.substring(0, 200) + "...");
      console.log("SVG length:", output.data.length);
      console.log("Is closed:", output.data.includes("</svg>"));
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
            console.log("Image copied to clipboard");
          }
        });
      } catch (err) {
        console.error("Failed to copy image:", err);
      }
    } else if (output.type === "svg") {
      try {
        await navigator.clipboard.writeText(output.data);
        console.log("SVG copied to clipboard");
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

{#if !output}
  <p class="text-neutral-500 text-sm">No input</p>
{:else if output.type === "image"}
  <div class="space-y-3">
    <div class="border border-neutral-300 p-2 bg-neutral-50">
      <canvas bind:this={canvasRef} class="max-w-full h-auto"></canvas>
    </div>

    <div class="flex gap-2">
      <button
        onclick={copyToClipboard}
        class="px-3 py-1 text-sm border border-neutral-900 hover:bg-neutral-100 transition"
      >
        Copy Image
      </button>
      <button
        onclick={saveFile}
        class="px-3 py-1 text-sm border border-neutral-900 hover:bg-neutral-100 transition"
      >
        Save Image
      </button>
    </div>
  </div>
{:else if output.type === "svg"}
  <div class="space-y-3">
    <div
      class="border border-neutral-300 p-2 bg-neutral-50 w-full max-w-full overflow-auto"
    >
      <div class="w-full max-w-full">
        {@html output.data}
      </div>
    </div>

    <div class="flex gap-2">
      <button
        onclick={copyToClipboard}
        class="px-3 py-1 text-sm border border-neutral-900 hover:bg-neutral-100 transition"
      >
        Copy SVG
      </button>
      <button
        onclick={saveFile}
        class="px-3 py-1 text-sm border border-neutral-900 hover:bg-neutral-100 transition"
      >
        Save SVG
      </button>
    </div>
  </div>
{/if}
