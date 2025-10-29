<script lang="ts">
  import type { Output, ProccessingNode } from "./ProcessingNode";
  import type { Adjustment } from "./Adjustment";
  import type { FX } from "./FX";
  import { createDefaultAdjustment } from "./Adjustment";
  import { newFX } from "./FX";
  import DraggableContainer from "./components/DraggableContainer.svelte";

  let sourceNode = $state<Output>({
    type: "image",
    data: new ImageData(1, 1), // placeholder empty image
  });

  let processingPipeline = $state<ProccessingNode<Adjustment | FX>[]>([
    {
      progress: 0,
      behavior: createDefaultAdjustment("HSL"),
      outputData: {
        type: "image",
        data: new ImageData(1, 1),
      },
    },
    {
      progress: 0,
      behavior: newFX("dot"),
      outputData: {
        type: "svg",
        data: "",
      },
    },
  ]);
</script>

{#snippet children()}
  <h1>Hello world</h1>
  <p>from teh other side</p>
{/snippet}

<DraggableContainer {children}></DraggableContainer>
