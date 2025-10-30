<script lang="ts">
  import {
    updateEndpoint,
    clearEndpoint,
    type EndpointType,
  } from "../endpoint";
  import type { Attachment } from "svelte/attachments";

  const { nodeIdx, type } = $props<{
    nodeIdx: number;
    type: EndpointType;
  }>();

  let element = $state<HTMLDivElement | null>(null);
  let animationFrameId: number | null = null;

  const endpointAttachment: Attachment<HTMLDivElement> = (
    div: HTMLDivElement
  ) => {
    element = div;

    function updatePosition() {
      if (!element) return;

      const rect = element.getBoundingClientRect();

      // Report position in screen space
      updateEndpoint(nodeIdx, type, rect.left, rect.top);

      animationFrameId = requestAnimationFrame(updatePosition);
    }

    // Start the update loop
    animationFrameId = requestAnimationFrame(updatePosition);

    // Cleanup function
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      clearEndpoint(nodeIdx, type);
    };
  };
</script>

<div {@attach endpointAttachment} class="w-0 h-0 pointer-events-none"></div>
