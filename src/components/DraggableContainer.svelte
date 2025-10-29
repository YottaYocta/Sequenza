<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";

  const {
    children,
    startX,
    startY,
  }: {
    children: Snippet;
    startX?: number;
    startY?: number;
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
  class="absolute flex items-center justify-start"
  style={`left: ${startX}px; top: ${startY}px`}
>
  <button
    {@attach handle}
    aria-label="container drag handle"
    class="flex group p-4 cursor-grab active:cursor-grabbing"
  >
    <!-- apparently translate does not change offset position... -->
    <span class=" w-4 h-32 transition bg-blue-600"></span>
  </button>
  {@render children?.()}
</div>
