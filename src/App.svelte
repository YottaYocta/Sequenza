<script lang="ts">
  import type { Output, ProccessingNode } from "./ProcessingNode";
  import type { Adjustment } from "./Adjustment";
  import type { FX } from "./FX";
  import { createDefaultAdjustment } from "./Adjustment";
  import { newFX } from "./FX";
  import AdjustmentNode from "./components/AdjustmentNode.svelte";
  import FXNode from "./components/FXNode.svelte";
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

  function handleUpdateAdjustment(nodeIndex: number, behavior: Adjustment) {
    processingPipeline[nodeIndex] = {
      ...processingPipeline[nodeIndex],
      behavior,
    };
  }

  function handleUpdateFX(nodeIndex: number, behavior: FX) {
    processingPipeline[nodeIndex] = {
      ...processingPipeline[nodeIndex],
      behavior,
    };
  }

  function isAdjustmentNode(
    node: ProccessingNode<Adjustment | FX>
  ): node is ProccessingNode<Adjustment> {
    return node.behavior.type === "HSL" || node.behavior.type === "RGB";
  }
</script>

<header class="w-full border-b p-4 flex items-center justify-center">
  <div class="w-full max-w-4xl">
    <h1>BRUTALFX</h1>
  </div>
</header>
<main class="w-full h-96 min-h-96 p-4 flex items-center justify-center">
  <div class="w-full h-96 max-w-4xl flex h-min-96 relative">
    {#each processingPipeline as node, index}
      {#if isAdjustmentNode(node)}
        <DraggableContainer startX={index * 400}>
          {#snippet children()}
            <AdjustmentNode
              nodeIndex={index}
              {node}
              onUpdateBehavior={handleUpdateAdjustment}
            />
          {/snippet}
        </DraggableContainer>
      {:else}
        <DraggableContainer startX={index * 400}>
          {#snippet children()}
            <FXNode
              nodeIndex={index}
              node={node as ProccessingNode<FX>}
              onUpdateBehavior={handleUpdateFX}
            />
          {/snippet}
        </DraggableContainer>
      {/if}
    {/each}
  </div>
</main>
