<script lang="ts">
  import type { Output, ProccessingNode } from "./ProcessingNode";
  import type { Adjustment } from "./Adjustment";
  import type { FX } from "./FX";
  import { createDefaultAdjustment } from "./Adjustment";
  import { newFX } from "./FX";
  import AdjustmentNode from "./components/AdjustmentNode.svelte";
  import FXNode from "./components/FXNode.svelte";
  import DraggableContainer from "./components/DraggableContainer.svelte";
  import ViewerNode from "./components/ViewerNode.svelte";
  import SourceNode from "./components/SourceNode.svelte";
  import DefaultImg from "./assets/headset.jpg";

  let sourceOutput = $state<Output>({
    type: "image",
    data: new ImageData(1, 1), // placeholder empty image
  });

  function handleSourceImageLoad(imageData: ImageData) {
    sourceOutput = {
      type: "image",
      data: imageData,
    };
  }

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
        data: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="26.6" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 308"><path fill="#FF3E00" d="M239.682 40.707C211.113-.182 154.69-12.301 113.895 13.69L42.247 59.356a82.198 82.198 0 0 0-37.135 55.056a86.566 86.566 0 0 0 8.536 55.576a82.425 82.425 0 0 0-12.296 30.719a87.596 87.596 0 0 0 14.964 66.244c28.574 40.893 84.997 53.007 125.787 27.016l71.648-45.664a82.182 82.182 0 0 0 37.135-55.057a86.601 86.601 0 0 0-8.53-55.577a82.409 82.409 0 0 0 12.29-30.718a87.573 87.573 0 0 0-14.963-66.244"></path><path fill="#FFF" d="M106.889 270.841c-23.102 6.007-47.497-3.036-61.103-22.648a52.685 52.685 0 0 1-9.003-39.85a49.978 49.978 0 0 1 1.713-6.693l1.35-4.115l3.671 2.697a92.447 92.447 0 0 0 28.036 14.007l2.663.808l-.245 2.659a16.067 16.067 0 0 0 2.89 10.656a17.143 17.143 0 0 0 18.397 6.828a15.786 15.786 0 0 0 4.403-1.935l71.67-45.672a14.922 14.922 0 0 0 6.734-9.977a15.923 15.923 0 0 0-2.713-12.011a17.156 17.156 0 0 0-18.404-6.832a15.78 15.78 0 0 0-4.396 1.933l-27.35 17.434a52.298 52.298 0 0 1-14.553 6.391c-23.101 6.007-47.497-3.036-61.101-22.649a52.681 52.681 0 0 1-9.004-39.849a49.428 49.428 0 0 1 22.34-33.114l71.664-45.677a52.218 52.218 0 0 1 14.563-6.398c23.101-6.007 47.497 3.036 61.101 22.648a52.685 52.685 0 0 1 9.004 39.85a50.559 50.559 0 0 1-1.713 6.692l-1.35 4.116l-3.67-2.693a92.373 92.373 0 0 0-28.037-14.013l-2.664-.809l.246-2.658a16.099 16.099 0 0 0-2.89-10.656a17.143 17.143 0 0 0-18.398-6.828a15.786 15.786 0 0 0-4.402 1.935l-71.67 45.674a14.898 14.898 0 0 0-6.73 9.975a15.9 15.9 0 0 0 2.709 12.012a17.156 17.156 0 0 0 18.404 6.832a15.841 15.841 0 0 0 4.402-1.935l27.345-17.427a52.147 52.147 0 0 1 14.552-6.397c23.101-6.006 47.497 3.037 61.102 22.65a52.681 52.681 0 0 1 9.003 39.848a49.453 49.453 0 0 1-22.34 33.12l-71.664 45.673a52.218 52.218 0 0 1-14.563 6.398"></path></svg>`,
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
    <!-- Source Node -->
    <DraggableContainer startX={0} startY={0}>
      {#snippet children()}
        <SourceNode
          onImageLoad={handleSourceImageLoad}
          defaultImagePath={DefaultImg}
        />
      {/snippet}
    </DraggableContainer>

    <!-- Source Viewer -->
    <DraggableContainer startX={400} startY={0}>
      {#snippet children()}
        <ViewerNode output={sourceOutput} />
      {/snippet}
    </DraggableContainer>

    {#each processingPipeline as node, index}
      {#if isAdjustmentNode(node)}
        <DraggableContainer startY={index * 400}>
          {#snippet children()}
            <AdjustmentNode
              nodeIndex={index}
              {node}
              onUpdateBehavior={handleUpdateAdjustment}
            />
          {/snippet}
        </DraggableContainer>
        <DraggableContainer startY={index * 400} startX={400}>
          {#snippet children()}
            <ViewerNode output={node.outputData}></ViewerNode>
          {/snippet}
        </DraggableContainer>
      {:else}
        <DraggableContainer startY={index * 400}>
          {#snippet children()}
            <FXNode
              nodeIndex={index}
              node={node as ProccessingNode<FX>}
              onUpdateBehavior={handleUpdateFX}
            />
          {/snippet}
        </DraggableContainer>
        <DraggableContainer startY={index * 400} startX={400}>
          <ViewerNode output={node.outputData}></ViewerNode>
        </DraggableContainer>
      {/if}
    {/each}
  </div>
</main>
