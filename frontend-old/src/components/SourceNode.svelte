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

  async function pasteFromClipboard() {
    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));

        if (imageType) {
          const blob = await item.getType(imageType);
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

          reader.readAsDataURL(blob);
          break;
        }
      }
    } catch (err) {
      console.error('Failed to read from clipboard:', err);
      alert('Failed to paste from clipboard. Make sure you have copied an image.');
    }
  }
</script>

<div class="flex items-center gap-2 py-3">
  <div class="border p-2 bg-white relative">
    <canvas {@attach canvasAttachment} class="w-24 h-auto"> </canvas>
    <span class="absolute right-0 bottom-0 w-2 h-2 bg-black translate-1/2">
    </span>
    <div class="absolute right-0 bottom-0">
      <Endpoint nodeIdx={0} type="end"></Endpoint>
    </div>
  </div>

  <div class="h-full flex flex-col gap-1">
    <div class="flex flex-col justify-start h-full">
      <h3 class="font-semibold">Source Image</h3>

      <input
        type="file"
        accept="image/*"
        bind:this={fileInputRef}
        onchange={handleFileUpload}
        class="hidden"
      />

      {#if currentImageData}
        <p>
          {currentImageData.width} x {currentImageData.height}
        </p>
      {:else}
        <div class="text-xs text-neutral-500">No image loaded</div>
      {/if}
    </div>

    <button
      onclick={triggerFileInput}
      class="button-1 outline hover:bg-neutral-200 relative"
    >
      {currentImageData ? "Change Image" : "Upload Image"}
    </button>
    <button
      onclick={pasteFromClipboard}
      class="button-1 outline hover:bg-neutral-200 relative"
    >
      Paste from Clipboard
    </button>
  </div>
</div>
