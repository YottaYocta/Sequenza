<script lang="ts">
  import type { Output, ProccessingNode } from "./ProcessingNode";
  import type { Adjustment } from "./Adjustment";
  import type { FX } from "./FX";
  import { createDefaultAdjustment } from "./Adjustment";
  import { newFX } from "./FX";
  import { untrack } from "svelte";
  import { updateProcessingNode, resetNodeState } from "./ProcessingNode";
  import AdjustmentNode from "./components/AdjustmentNode.svelte";
  import FXNode from "./components/FXNode.svelte";
  import DraggableContainer from "./components/DraggableContainer.svelte";
  import ViewerNode from "./components/ViewerNode.svelte";
  import SourceNode from "./components/SourceNode.svelte";
  import DefaultImg from "./assets/headset.jpg";
  import ConnectionLines from "./components/ConnectionLines.svelte";

  let sourceOutput = $state<Output>({
    type: "image",
    data: new ImageData(1, 1), // placeholder empty image
  });

  function handleSourceImageLoad(imageData: ImageData) {
    sourceOutput = {
      type: "image",
      data: imageData,
    };

    // Reset all nodes' progress when source image changes
    for (let i = 0; i < processingPipeline.length; i++) {
      processingPipeline[i] = {
        ...processingPipeline[i],
        progress: 0,
      };
    }

    // Toggle render trigger to restart processing from the beginning
    renderTrigger = !renderTrigger;
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

    // Find the first node with progress < 1 (incomplete node)
    let currentNodeIndex = untrack(() => {
      const pipeline = processingPipeline;
      for (let i = 0; i < pipeline.length; i++) {
        if (pipeline[i].progress < 1) {
          return i;
        }
      }
      return pipeline.length; // All nodes complete
    });

    // If all nodes are complete, nothing to do
    if (currentNodeIndex >= processingPipeline.length) {
      return;
    }

    // Reset the first incomplete node's state using unified reset function
    untrack(() => {
      const node = processingPipeline[currentNodeIndex];
      processingPipeline[currentNodeIndex] = resetNodeState(
        node,
        sourceImageData
      );
    });

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
        console.log("finished:");
        currentNodeIndex++;

        // If there are more nodes, reset the next node if needed and continue processing
        if (currentNodeIndex < pipeline.length) {
          untrack(() => {
            const nextNode = processingPipeline[currentNodeIndex];

            // If next node needs processing (progress < 1), reset its state
            if (nextNode.progress < 1) {
              processingPipeline[currentNodeIndex] = resetNodeState(
                nextNode,
                sourceImageData
              );
            }
          });

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
    nodeIndex = Math.floor(nodeIndex / 2);
    // Reset state in the behavior (ensure state.nextRow = 0)
    const resetBehavior = {
      ...behavior,
      state: {
        nextRow: 0,
      },
    };

    // Update the specific node with new behavior and reset progress
    processingPipeline[nodeIndex] = {
      ...processingPipeline[nodeIndex],
      behavior: resetBehavior,
      progress: 0,
    };

    // Reset progress for all downstream nodes
    for (let i = nodeIndex + 1; i < processingPipeline.length; i++) {
      processingPipeline[i] = {
        ...processingPipeline[i],
        progress: 0,
      };
    }

    // Toggle render trigger to restart processing
    renderTrigger = !renderTrigger;
  }

  function handleUpdateFX(nodeIndex: number, behavior: FX) {
    // Reset state in the behavior (ensure state.nextRow = 0 or nextBar = 0)
    nodeIndex = Math.floor(nodeIndex / 2);

    let resetBehavior;
    if (behavior.type === "bar") {
      resetBehavior = {
        ...behavior,
        state: {
          nextBar: 0,
        },
      };
    } else if (behavior.type === "ascii") {
      resetBehavior = {
        ...behavior,
        state: {
          nextRow: 0,
        },
      };
    } else {
      resetBehavior = {
        ...behavior,
        state: {
          nextRow: 0,
        },
      };
    }

    // Update the specific node with new behavior and reset progress
    processingPipeline[nodeIndex] = {
      ...processingPipeline[nodeIndex],
      behavior: resetBehavior,
      progress: 0,
    };

    // Reset progress for all downstream nodes
    for (let i = nodeIndex + 1; i < processingPipeline.length; i++) {
      processingPipeline[i] = {
        ...processingPipeline[i],
        progress: 0,
      };
    }

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
  <div class="w-full max-w-4xl px-6">
    <h1>BRUTALFX</h1>
  </div>
</header>
<main class="w-full min-h-96 p-4 py-8 flex flexcitems-center justify-center">
  <div class="w-full h-10 max-w-4xl relative">
    <DraggableContainer>
      {#snippet children()}
        <SourceNode
          onImageLoad={handleSourceImageLoad}
          defaultImagePath={DefaultImg}
        />
      {/snippet}
    </DraggableContainer>

    <DraggableContainer startY={200}>
      {#snippet children()}
        <AdjustmentNode
          nodeIndex={0}
          node={processingPipeline[0] as ProccessingNode<Adjustment>}
          onUpdateBehavior={handleUpdateAdjustment}
        />
      {/snippet}
    </DraggableContainer>

    <!-- Viewer: even indices on right, odd indices on left (opposite of node) -->
    <DraggableContainer mergedMode={true} startX={500}>
      {#snippet children()}
        <ViewerNode nodeIndex={1} output={processingPipeline[0].outputData}
        ></ViewerNode>
      {/snippet}
    </DraggableContainer>

    <DraggableContainer startY={450}>
      {#snippet children()}
        <FXNode
          nodeIndex={2}
          node={processingPipeline[1] as ProccessingNode<FX>}
          onUpdateBehavior={handleUpdateFX}
        />
      {/snippet}
    </DraggableContainer>

    <DraggableContainer mergedMode={true} startX={500} startY={400}>
      <ViewerNode nodeIndex={3} output={processingPipeline[1].outputData}
      ></ViewerNode>
    </DraggableContainer>

    <!-- Connection lines SVG -->
    <ConnectionLines />
  </div>
</main>
