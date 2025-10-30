<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import type { Output } from "../ProcessingNode";
  import { getImageData, getSvgData } from "../ProcessingNode";
  import Endpoint from "./Endpoint.svelte";

  interface Props {
    output?: Output;
    nodeIndex: number;
  }

  const { output, nodeIndex }: Props = $props();

  let canvasElement: HTMLCanvasElement | undefined = $state();

  /**
   * Canvas attachment that renders the output data to the canvas.
   * Only used for image outputs or when we need a rasterized version of SVG.
   */
  const renderCanvas: Attachment<HTMLCanvasElement> = (
    canvas: HTMLCanvasElement
  ) => {
    // Store reference for copy/save functions
    canvasElement = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (output && output.type === "image") {
      // Direct rendering for image outputs
      canvas.width = output.data.width;
      canvas.height = output.data.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(output.data, 0, 0);
    } else if (output && output.type === "svg") {
      // Convert SVG to canvas for image export functionality
      (async () => {
        const imageData = await getImageData(output);
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);
      })();
    }
  };

  async function copyImageToClipboard() {
    if (!output || !canvasElement) return;

    try {
      canvasElement.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
        }
      });
    } catch (err) {
      console.error("Failed to copy image:", err);
    }
  }

  async function copySvgToClipboard() {
    if (!output) return;

    const svgData = getSvgData(output);
    if (!svgData) {
      console.error("No SVG data available");
      return;
    }

    try {
      await navigator.clipboard.writeText(svgData);
    } catch (err) {
      console.error("Failed to copy SVG:", err);
    }
  }

  function saveImageFile() {
    if (!output || !canvasElement) return;

    canvasElement.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "image.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  function saveSvgFile() {
    if (!output) return;

    const svgData = getSvgData(output);
    if (!svgData) {
      console.error("No SVG data available");
      return;
    }

    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.svg";
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div
  class="w-72 h-72 flex flex-col gap-1 items-start justify-start rounded-tr-3xl p-4 border bg-neutral-50"
>
  <span
    class="absolute top-0 elft-0 -translate-1/2 w-2 h-2 bg-black flex items-center"
  >
    <Endpoint nodeIdx={nodeIndex} type="start"></Endpoint>
  </span>

  <span
    class="absolute bottom-0 right-0 translate-1/2 w-2 h-2 bg-black flex items-center"
  >
    <Endpoint nodeIdx={nodeIndex} type="end"></Endpoint>
  </span>
  {#if !output}
    <p class="text-neutral-500 text-sm">No input</p>
  {:else if output.type === "image"}
    <div class="w-full h-min justify-start items-center flex gap-2">
      <button onclick={copyImageToClipboard} class="button-1">
        COPY IMAGE
      </button>
      <button onclick={saveImageFile} class="button-1"> SAVE IMAGE </button>
    </div>
    <div class="h-full w-full flex items-center justify-center">
      <canvas
        {@attach renderCanvas}
        class="max-w-48 h-auto max-h-48 hover:outline"
      ></canvas>
    </div>
  {:else if output.type === "svg"}
    <div class="w-full h-min flex gap-2 text-nowrap flex-wrap gap-y-0">
      <button onclick={copySvgToClipboard} class="button-1"> COPY SVG </button>
      <button onclick={saveSvgFile} class="button-1"> SAVE SVG </button>
      <button onclick={copyImageToClipboard} class="button-1">
        COPY IMAGE
      </button>
      <button onclick={saveImageFile} class="button-1"> SAVE IMAGE </button>
    </div>

    <div class="w-full h-full flex items-center justify-center p-2">
      <svg
        viewBox="{output.data.viewBox.x} {output.data.viewBox.y} {output.data
          .viewBox.width} {output.data.viewBox.height}"
        xmlns="http://www.w3.org/2000/svg"
        class="max-w-48 max-h-48 h-auto hover:outline"
      >
        {@html output.data.children.join("")}
      </svg>
    </div>

    <!-- Hidden canvas for image export functionality -->
    <canvas {@attach renderCanvas} class="hidden"></canvas>
  {/if}

  {#if output !== undefined}
    <p class="text-sm absolute bottom-2 left-4 translate-x-1/2">
      {output.type === "svg" ? output.data.viewBox.width : output.data.width} x
      {output.type === "svg" ? output.data.viewBox.height : output.data.height}
    </p>
  {/if}
</div>
