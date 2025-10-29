<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";

  const {
    children,
    startX,
    startY,
    mergedMode = false,
  }: {
    children: Snippet;
    startX?: number;
    startY?: number;
    mergedMode?: boolean;
  } = $props();

  type DragState = { startX: number; startY: number } | null;

  let dragging = $state<DragState>(null);

  const draggable: Attachment<HTMLDivElement> = (element: HTMLDivElement) => {
    if (dragging !== null) {
      const offsetX = dragging.startX;
      const offsetY = dragging.startY;

      const handleMouseMove = (e: MouseEvent) => {
        const parentRect = element.parentElement?.getBoundingClientRect() || {
          left: 0,
          top: 0,
        };

        const relativeX = e.clientX - parentRect.left;
        const relativeY = e.clientY - parentRect.top;

        element.style.left = `${relativeX - offsetX}px`;
        element.style.top = `${relativeY - offsetY}px`;
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => {
        // Cleanup on unmount
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }
  };

  const handle: Attachment<HTMLButtonElement> = (
    dragHandle: HTMLButtonElement
  ) => {
    const handleMouseDown = (e: MouseEvent) => {
      dragging = {
        startX: e.offsetX + dragHandle.offsetLeft,
        startY: e.offsetY + dragHandle.offsetTop,
      };

      window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseUp = () => {
      dragging = null;
      window.removeEventListener("mouseup", handleMouseUp);
    };

    dragHandle.addEventListener("mousedown", handleMouseDown);
    return () => {
      dragHandle.removeEventListener("mousedown", handleMouseDown);
    };
  };
</script>

<div
  {@attach draggable}
  role="button"
  tabindex="0"
  class={`absolute flex items-stretch justify-start ${mergedMode ? "" : "items-center"}`}
  style={`left: ${startX}px; top: ${startY}px`}
>
  <button
    {@attach handle}
    aria-label="container drag handle"
    class={`flex self-stretch group ${mergedMode ? "p-0" : "p-4 px-8"} pl-6 cursor-grab active:cursor-grabbing`}
  >
    <span
      class={`group-active:scale-105 w-2 ${mergedMode ? "h-full" : "h-24"} transition bg-black`}
    ></span>
  </button>
  {@render children?.()}
</div>
