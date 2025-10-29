<script lang="ts">
  import { type Attachment } from "svelte/attachments";
  let { startX, startY, endX, endY } = $props(); // positions relative to closest positioned parent

  const lineAttachment: Attachment<SVGElement> = (element: SVGElement) => {
    // set innerhtml to be a line with one point at startX and startY and another at endX, endY. use relative positioning, so the y-component of the lower coordinate is zero

    const offsetX = Math.min(startX, endX);
    const offsetY = Math.min(startY, endY);

    const shiftedStartX = startX - offsetX;
    const shiftedStartY = startY - offsetY;
    const shiftedEndX = endX - offsetX;
    const shiftedEndY = endY - offsetY;

    element.innerHTML = `
    <path d="M ${shiftedStartX} ${shiftedStartY} L ${shiftedEndX} ${shiftedEndY}"/> 
    `;

    element.style.left = `${offsetX}px`;
    element.style.top = `${offsetY}px`;
    element.style.width = `${Math.abs(endX - startX)}px`;
    element.style.height = `${Math.abs(endY - startY)}px`;
  };
</script>

<svg {@attach lineAttachment} class="absolute color-black stroke-black"></svg>
