<script lang="ts">
  import { endpointPositions } from "../endpoint";
  import type { Attachment } from "svelte/attachments";

  let svgElement = $state<SVGSVGElement | null>(null);

  const svgAttachment: Attachment<SVGSVGElement> = (element: SVGSVGElement) => {
    svgElement = element;
    let animationFrameId: number | null = null;

    function updateLines() {
      if (!svgElement) return;

      // Get SVG element's bounding rect to calculate offset
      const svgRect = svgElement.getBoundingClientRect();
      const svgOffsetX = svgRect.left;
      const svgOffsetY = svgRect.top;

      // Set SVG width and height to cover the viewport
      svgElement.setAttribute("width", window.innerWidth.toString());
      svgElement.setAttribute("height", window.innerHeight.toString());

      // Build SVG paths connecting end -> start for sequential nodes
      let pathsHTML = "";

      // Sort endpoints by nodeIdx to ensure correct ordering
      const sortedPositions = [...endpointPositions].sort(
        (a, b) => a.nodeIdx - b.nodeIdx
      );

      // Find all end points and connect to next start point
      for (let i = 0; i < sortedPositions.length; i++) {
        const current = sortedPositions[i];

        if (current.type === "end") {
          // Find the next start point (next sequential nodeIdx)
          const nextStart = sortedPositions.find(
            (ep) => ep.type === "start" && ep.nodeIdx > current.nodeIdx
          );

          if (nextStart) {
            // Adjust coordinates relative to SVG element's position
            const startX = current.x - svgOffsetX;
            const startY = current.y - svgOffsetY;
            const endX = nextStart.x - svgOffsetX;
            const endY = nextStart.y - svgOffsetY;

            // Draw line from current end to next start
            pathsHTML += `<path d="M ${startX} ${startY} L ${endX} ${endY}" stroke="black" stroke-width="1" fill="none"/>`;
          }
        }
      }

      svgElement.innerHTML = pathsHTML;

      animationFrameId = requestAnimationFrame(updateLines);
    }

    // Start the update loop
    animationFrameId = requestAnimationFrame(updateLines);

    // Cleanup
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  };
</script>

<svg {@attach svgAttachment} class="absolute inset-0 pointer-events-none -z-10"
></svg>
