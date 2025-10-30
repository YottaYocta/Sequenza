<script lang="ts">
  import { endpointPositions } from "../endpoint";
  import type { Attachment } from "svelte/attachments";

  let svgElement = $state<SVGSVGElement | null>(null);

  const svgAttachment: Attachment<SVGSVGElement> = (element: SVGSVGElement) => {
    svgElement = element;
    let animationFrameId: number | null = null;

    function updateLines() {
      if (!svgElement) return;

      // Sort endpoints by nodeIdx to ensure correct ordering
      const sortedPositions = [...endpointPositions].sort(
        (a, b) => a.nodeIdx - b.nodeIdx
      );

      // If no endpoints, clear and return
      if (sortedPositions.length === 0) {
        svgElement.innerHTML = "";
        animationFrameId = requestAnimationFrame(updateLines);
        return;
      }

      // Calculate bounding box of all endpoints (in viewport space)
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const pos of sortedPositions) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
      }

      // Get parent element to calculate parent-relative position
      const parent = svgElement.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();

      // Convert viewport coords to parent-relative coords
      const parentRelativeX = minX - parentRect.left;
      const parentRelativeY = minY - parentRect.top;

      // Calculate SVG dimensions based on bounding box
      const svgWidth = maxX - minX;
      const svgHeight = maxY - minY;

      // Position SVG at the minimum coordinate (top-left of bounding box)
      svgElement.style.left = `${parentRelativeX}px`;
      svgElement.style.top = `${parentRelativeY}px`;
      svgElement.setAttribute("width", svgWidth.toString());
      svgElement.setAttribute("height", svgHeight.toString());

      // Build SVG paths connecting end -> start for sequential nodes
      let pathsHTML = "";

      // Find all end points and connect to next start point
      for (let i = 0; i < sortedPositions.length; i++) {
        const current = sortedPositions[i];

        if (current.type === "end") {
          // Find the next start point (next sequential nodeIdx)
          const nextStart = sortedPositions.find(
            (ep) => ep.type === "start" && ep.nodeIdx > current.nodeIdx
          );

          if (nextStart) {
            // Coordinates are now relative to SVG's top-left (minX, minY)
            const startX = current.x - minX;
            const startY = current.y - minY;
            const endX = nextStart.x - minX;
            const endY = nextStart.y - minY;

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

<svg
  {@attach svgAttachment}
  class="absolute pointer-events-none -z-10"
></svg>
