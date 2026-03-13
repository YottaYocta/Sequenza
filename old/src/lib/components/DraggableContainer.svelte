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
      const initialRect = element.getBoundingClientRect();
      // gives dragging start position relative to current element
      const dragOffsetX = dragging.startX - initialRect.left;
      const dragOffsetY = dragging.startY - initialRect.top;

      const handleMouseMove = (e: MouseEvent) => {
        const parentRect = element.offsetParent?.getBoundingClientRect() ?? {
          top: 0,
          left: 0,
        };
        const normalizedMouseX = e.clientX - parentRect.left;
        const normalizedMouseY = e.clientY - parentRect.top;
        const targetX = normalizedMouseX - dragOffsetX;
        const targetY = normalizedMouseY - dragOffsetY;

        element.style.left = `${targetX}px`;
        element.style.top = `${targetY}px`;
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
        startX: e.clientX,
        startY: e.clientY,
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
      class={`group-active:scale-x-200 w-2 ${mergedMode ? "h-full" : "h-24"} transition bg-black`}
    ></span>
  </button>
  {@render children?.()}
</div>
