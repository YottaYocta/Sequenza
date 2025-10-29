<script lang="ts">
  import type { Attachment } from "svelte/attachments";

  const { children } = $props();

  type DragState = { startX: number; startY: number } | null;

  let dragging = $state<DragState>(null);

  const draggable: Attachment<HTMLDivElement> = (element: HTMLDivElement) => {
    if (dragging !== null) {
      const offsetX = dragging.startX;
      const offsetY = dragging.startY;

      const handleMouseMove = (e: MouseEvent) => {
        const relativeX = e.clientX - element.clientLeft;
        const relativeY = e.clientY - element.clientTop;

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
        startY: e.offsetY + dragHandle.offsetTop - dragHandle.offsetHeight / 2,
      };

      console.log(dragging);

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
  style="position: absolute; left: 100px; top: 100px;"
  role="button"
  tabindex="0"
>
  <button
    {@attach handle}
    aria-label="container drag handle"
    class="absolute flex group p-4 cursor-grab active:cursor-grabbing -left-12 top-1/2 -translate-y-1/2"
  >
    <!-- apparently translate does not change offset position... -->
    <span class=" w-4 h-32 transition bg-blue-600"></span>
  </button>
  {@render children?.()}
</div>
