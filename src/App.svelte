<script lang="ts">
  import type { Behavior } from "./core/Behavior";
  import type { EditorState } from "./core/EditorState";
  import {
    newEditorState,
    setSource,
    pushUnit,
    pollUnprocessedUnits,
    updateBehaviorAt,
    processTaskStep,
  } from "./core/EditorState";
  import { createNewRGBBehavior } from "./adjustments/rgb";
  import { createNewDotBehavior } from "./fx/dots";
  import { untrack } from "svelte";
  import AdjustmentNode from "./components/AdjustmentNode.svelte";
  import FXNode from "./components/FXNode.svelte";
  import DraggableContainer from "./components/DraggableContainer.svelte";
  import ViewerNode from "./components/ViewerNode.svelte";
  import SourceNode from "./components/SourceNode.svelte";
  import DefaultImg from "./assets/headset.jpg";
  import ConnectionLines from "./components/ConnectionLines.svelte";

  // Initialize editor state with placeholder
  let editorState: EditorState = $state<EditorState>(
    newEditorState({
      type: "image",
      data: new ImageData(1, 1),
    })
  );

  // Initialize with RGB and Dot behaviors
  (async () => {
    await pushUnit(editorState, createNewRGBBehavior());
    await pushUnit(editorState, createNewDotBehavior());
  })();

  // Boolean trigger for re-rendering
  let renderTrigger = $state(false);

  async function handleSourceImageLoad(imageData: ImageData) {
    await setSource(editorState, {
      type: "image",
      data: imageData,
    });

    renderTrigger = !renderTrigger;
  }

  $effect(() => {
    // Create dependency on renderTrigger
    renderTrigger;

    // Only process if we have actual image data
    const source = editorState.source;
    if (!source || source.type !== "image") return;
    const sourceImageData = source.data;
    if (sourceImageData.width <= 1) return;

    // Cleanup function for animation frame
    let animationFrameId: number | null = null;

    // Run in untracked section to sync currentTask
    untrack(async () => {
      await pollUnprocessedUnits(editorState);

      // If there's a current task, start processing
      if (editorState.currentTask !== null) {
        async function processFrame() {
          const hasMore = untrack(() => processTaskStep(editorState));

          if (!hasMore) {
            // Current task completed, check for next task
            await pollUnprocessedUnits(editorState);

            if (editorState.currentTask !== null) {
              // There's another task to process
              animationFrameId = requestAnimationFrame(processFrame);
            } else {
              // All tasks complete, trigger re-render
              renderTrigger = !renderTrigger;
            }
          } else {
            // Continue processing current task
            animationFrameId = requestAnimationFrame(processFrame);
          }
        }

        // Start processing
        animationFrameId = requestAnimationFrame(processFrame);
      }
    });

    // Cleanup function
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  });

  async function handleUpdateBehavior(nodeIndex: number, behavior: Behavior) {
    const actualIndex = Math.floor(nodeIndex / 2);
    await updateBehaviorAt(editorState, actualIndex, behavior);
    renderTrigger = !renderTrigger;
  }

  function isAdjustmentBehavior(behavior: Behavior): boolean {
    return (
      behavior.type === "hsl" ||
      behavior.type === "rgb" ||
      behavior.type === "gradientmap"
    );
  }
</script>

<header class="w-full border-b p-4 flex items-center justify-center">
  <div class="w-full max-w-4xl px-6">
    <h1 class="text-3xl tracking-[-0.25rem] font-medium">BRUTALFX</h1>
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

    {#each editorState.processingUnits as unit, idx}
      <DraggableContainer startY={idx === 0 ? 200 : 100 + 350 * idx}>
        {#snippet children()}
          {#if isAdjustmentBehavior(unit.behavior)}
            <AdjustmentNode
              nodeIndex={idx * 2 + 1}
              behavior={unit.behavior}
              onUpdateBehavior={handleUpdateBehavior}
            />
          {:else}
            <FXNode
              nodeIndex={idx * 2 + 1}
              behavior={unit.behavior}
              onUpdateBehavior={handleUpdateBehavior}
            />
          {/if}
        {/snippet}
      </DraggableContainer>
      <DraggableContainer
        mergedMode={true}
        startX={500}
        startY={75 + 350 * idx}
      >
        {#snippet children()}
          <ViewerNode nodeIndex={(idx + 1) * 2} output={unit.cachedOutput}
          ></ViewerNode>
        {/snippet}
      </DraggableContainer>
    {/each}

    <!-- Connection lines SVG -->
    <ConnectionLines />
  </div>
</main>
