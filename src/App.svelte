<script lang="ts">
  import type { Output, ProccessingNode } from "./ProcessingNode";
  import type { Adjustment } from "./Adjustment";
  import type { FX } from "./FX";
  import { createDefaultAdjustment } from "./Adjustment";
  import { newFX } from "./FX";
  import { untrack } from "svelte";
  import { updateProcessingNode } from "./ProcessingNode";
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
        data: "",
      },
    },
  ]);

  // Boolean trigger for re-rendering - toggles whenever behavior changes
  let renderTrigger = $state(false);

  $effect(() => {
    // this effect runs whenever the source image changes or renderTrigger toggles
    const source = sourceOutput;
    renderTrigger; // create dependency on renderTrigger

    // Only process if we have actual image data
    if (source.type !== "image") return;
    const sourceImageData = source.data;
    if (sourceImageData.width <= 1) return;

    // Reset all progress to zero and reset state-related variables (nextRow)
    untrack(() => {
      processingPipeline = processingPipeline.map((node) => {
        // Reset state-related variables in behavior
        let resetBehavior = { ...node.behavior };
        if ("nextRow" in resetBehavior) {
          resetBehavior = { ...resetBehavior, nextRow: 0 };
        }

        return {
          ...node,
          progress: 0,
          behavior: resetBehavior,
          outputData:
            node.outputData.type === "image"
              ? { type: "image", data: new ImageData(sourceImageData.width, sourceImageData.height) }
              : node.outputData,
        };
      });
    });

    let currentNodeIndex = 0;
    let animationFrameId: number | null = null;

    function processFrame() {
      // Use untrack to read pipeline state without creating dependencies
      const pipeline = untrack(() => processingPipeline);
      const currentNode = pipeline[currentNodeIndex];

      if (!currentNode) {
        // Done processing all nodes
        return;
      }

      // Determine the source for this node (either original source or previous node's output)
      let nodeSource: ImageData;
      if (currentNodeIndex === 0) {
        nodeSource = sourceImageData;
      } else {
        const prevOutput = pipeline[currentNodeIndex - 1].outputData;
        if (prevOutput.type === "image") {
          nodeSource = prevOutput.data;
        } else {
          // If previous node output is SVG, use original source
          nodeSource = sourceImageData;
        }
      }

      // Process one iteration
      const updatedNode = updateProcessingNode(currentNode, nodeSource);

      // Update the pipeline with the new node state
      untrack(() => {
        processingPipeline[currentNodeIndex] = updatedNode;
      });

      // Check if current node is complete
      if (updatedNode.progress >= 1) {
        // Move to next node
        currentNodeIndex++;

        // If there are more nodes, continue processing
        if (currentNodeIndex < pipeline.length) {
          animationFrameId = requestAnimationFrame(processFrame);
        }
      } else {
        // Continue processing current node
        animationFrameId = requestAnimationFrame(processFrame);
      }
    }

    // Start processing
    animationFrameId = requestAnimationFrame(processFrame);

    // Cleanup function
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  });

  function handleUpdateAdjustment(nodeIndex: number, behavior: Adjustment) {
    // Reset state-related variables in the behavior
    const resetBehavior = { ...behavior, nextRow: 0 };

    // Update the behavior in the pipeline
    processingPipeline[nodeIndex] = {
      ...processingPipeline[nodeIndex],
      behavior: resetBehavior,
      progress: 0, // Reset progress
    };

    // Toggle render trigger to restart processing
    renderTrigger = !renderTrigger;
  }

  function handleUpdateFX(nodeIndex: number, behavior: FX) {
    // Reset state-related variables in the behavior
    const resetBehavior = { ...behavior, nextRow: 0 };

    // Update the behavior in the pipeline
    processingPipeline[nodeIndex] = {
      ...processingPipeline[nodeIndex],
      behavior: resetBehavior,
      progress: 0, // Reset progress
    };

    // Toggle render trigger to restart processing
    renderTrigger = !renderTrigger;
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
  <div class="w-full h-96 max-w-4xl h-min-96 relative grid grid-cols-2 gap-8">
    <div class="relative h-96">
      <!-- Source Node -->
      <DraggableContainer>
        {#snippet children()}
          <SourceNode
            onImageLoad={handleSourceImageLoad}
            defaultImagePath={DefaultImg}
          />
        {/snippet}
      </DraggableContainer>
    </div>
    <div class="relative h-72"></div>
    {#each processingPipeline as node, index}
      {#if isAdjustmentNode(node)}
        <div class="relative h-72">
          <DraggableContainer>
            {#snippet children()}
              <AdjustmentNode
                nodeIndex={index}
                {node}
                onUpdateBehavior={handleUpdateAdjustment}
              />
            {/snippet}
          </DraggableContainer>
        </div>

        <div class="relative h-72">
          <DraggableContainer>
            {#snippet children()}
              <ViewerNode output={node.outputData}></ViewerNode>
            {/snippet}
          </DraggableContainer>
        </div>
      {:else}
        <div class="relative h-72">
          <DraggableContainer>
            {#snippet children()}
              <FXNode
                nodeIndex={index}
                node={node as ProccessingNode<FX>}
                onUpdateBehavior={handleUpdateFX}
              />
            {/snippet}
          </DraggableContainer>
        </div>
        <div class="relative h-72">
          <DraggableContainer>
            <ViewerNode output={node.outputData}></ViewerNode>
          </DraggableContainer>
        </div>
      {/if}
    {/each}
  </div>
</main>
