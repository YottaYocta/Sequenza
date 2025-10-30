<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import Endpoint from "./Endpoint.svelte";

  const { onImageLoad, defaultImagePath } = $props<{
    onImageLoad: (imageData: ImageData) => void;
    defaultImagePath?: string;
  }>();

  let fileInputRef: HTMLInputElement | undefined = $state();
  let currentImageData: ImageData | undefined = $state();
  let canvasCtx: CanvasRenderingContext2D | undefined = $state();

  function loadImageFromUrl(
    ctx: CanvasRenderingContext2D,
    url: string,
    onLoad: (imageData: ImageData) => void
  ) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = ctx.canvas;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      onLoad(imageData);
    };
    img.onerror = (err) => {
      console.error("Failed to load image:", err);
    };
    img.src = url;
  }

  const canvasAttachment: Attachment<HTMLCanvasElement> = (
    canvas: HTMLCanvasElement
  ) => {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvasCtx = ctx;
      if (defaultImagePath) {
        loadImageFromUrl(ctx, defaultImagePath, (imageData) => {
          currentImageData = imageData;
          onImageLoad(imageData);
        });
      }
    }
  };

  function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && canvasCtx) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        if (url && canvasCtx) {
          loadImageFromUrl(canvasCtx, url, (imageData) => {
            currentImageData = imageData;
            onImageLoad(imageData);
          });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function triggerFileInput() {
    fileInputRef?.click();
  }
</script>

<div class="flex items-center gap-2">
  <div class="flex flex-col gap-1">
    <h3 class="font-semibold">Source Image</h3>

    <input
      type="file"
      accept="image/*"
      bind:this={fileInputRef}
      onchange={handleFileUpload}
      class="hidden"
    />

    <div class="border border-neutral-300 p-2 bg-neutral-50">
      <canvas {@attach canvasAttachment} class="w-24 h-auto"></canvas>
    </div>

    {#if currentImageData}
      <div class="text-xs text-neutral-500">
        Size: {currentImageData.width} × {currentImageData.height}
      </div>
    {:else}
      <div class="text-xs text-neutral-500">No image loaded</div>
    {/if}
  </div>

  <button
    onclick={triggerFileInput}
    class="w-min h-min text-nowrap text-sm border border-neutral-900 hover:bg-neutral-200 active:bg-black active:text-white relative"
  >
    {currentImageData ? "Change Image" : "Upload Image"}
    <div class="absolute right-0 bottom-0">
      <Endpoint nodeIdx="0" type="end"></Endpoint>
    </div>
  </button>
</div>
