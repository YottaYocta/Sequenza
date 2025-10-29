<script lang="ts">
  import type { Attachment } from "svelte/attachments";

  const { children } = $props();

  const draggable: Attachment<HTMLDivElement> = (element: HTMLDivElement) => {
    const handleMouseMove = (e: MouseEvent) => {
      element.style.left = `${e.clientX}px`;
      element.style.top = `${e.clientY}px`;
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDown = () => {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    element.addEventListener("mousedown", handleMouseDown);

    return () => {
      // Cleanup on unmount
      element.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  };
</script>

<div
  {@attach draggable}
  style="position: absolute; left: 0px; top: 0px; transform: translateX(-50%) translateY(-50%);"
  role="button"
  tabindex="0"
  class="w-32 h-32 border border-neutral-900"
>
  <button
    aria-label="container drag handle"
    class="absolute flex group p-4 cursor-grab active:cursor-grabbing -left-12 top-1/2 -translate-y-1/2"
  >
    <span class="group-hover:scale-105 w-3 h-32 transition bg-blue-600"></span>
  </button>
  {@render children?.()}
</div>
