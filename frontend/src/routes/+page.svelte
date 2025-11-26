<script lang="ts">
	import type { Behavior } from '$lib/processing/Behavior';
	import type { EditorState } from '$lib/processing/EditorState';
	import {
		newEditorState,
		setSource,
		pushUnit,
		pollUnprocessedUnits,
		updateBehaviorAt,
		processTaskStep,
		removeUnitAt
	} from '$lib/processing/EditorState';

	import { createNewDotBehavior } from '$lib/processing/fx/dots';
	import { untrack } from 'svelte';
	import AdjustmentNode from '$lib/components/AdjustmentNode.svelte';
	import FXNode from '$lib/components/FXNode.svelte';
	import DraggableContainer from '$lib/components/DraggableContainer.svelte';
	import ViewerNode from '$lib/components/ViewerNode.svelte';
	import SourceNode from '$lib/components/SourceNode.svelte';
	import DefaultImg from '$lib/assets/headset.jpg';
	import ConnectionLines from '$lib/components/ConnectionLines.svelte';
	import { createNewHSLBehavior } from '$lib/processing/adjustments/hsl/hsl';

	// placeholder
	let editorState: EditorState = $state<EditorState>(
		newEditorState({
			type: 'image',
			data: new ImageData(1, 1)
		})
	);

	(async () => {
		await pushUnit(editorState, createNewHSLBehavior());
		await pushUnit(editorState, createNewDotBehavior());
	})();

	let renderTrigger = $state(false);

	async function handleSourceImageLoad(imageData: ImageData) {
		await setSource(editorState, {
			type: 'image',
			data: imageData
		});

		renderTrigger = !renderTrigger;
	}

	$effect(() => {
		// Only process if we have loaded source image data. For now, only allow images
		const source = editorState.source;
		if (!source || source.type !== 'image') return;

		const sourceImageData = source.data;
		if (sourceImageData.width <= 1) return;

		let animationFrameId: number | null = null;

		if (editorState.currentTask !== null) {
			async function processFrame() {
				const taskFinished = untrack(() => processTaskStep(editorState));

				if (taskFinished) {
					// Current task completed, check for next task
					await pollUnprocessedUnits(editorState);
				} else {
					// Continue processing current task
					animationFrameId = requestAnimationFrame(processFrame);
				}
			}

			animationFrameId = requestAnimationFrame(processFrame);
		}

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
			behavior.type === 'hsl' ||
			behavior.type === 'rgb' ||
			behavior.type === 'gradientmap' ||
			behavior.type === 'chromakey' ||
			behavior.type === 'scale'
		);
	}

	async function handleDelete(nodeIndex: number) {
		const realNodeIndex = Math.floor(nodeIndex / 2);
		if (realNodeIndex >= 0 && realNodeIndex < editorState.processingUnits.length)
			removeUnitAt(editorState, realNodeIndex);
	}
</script>

<main class="w-full min-h-96 p-4 py-8 flex flexcitems-center justify-center font-work-sans">
	<div class="w-full h-10 max-w-4xl relative">
		<DraggableContainer>
			{#snippet children()}
				<SourceNode onImageLoad={handleSourceImageLoad} defaultImagePath={DefaultImg} />
			{/snippet}
		</DraggableContainer>

		{#each editorState.processingUnits as unit, idx}
			<DraggableContainer startY={idx === 0 ? 200 : 100 + 350 * idx}>
				{#snippet children()}
					{#if isAdjustmentBehavior(unit.behavior)}
						<AdjustmentNode
							nodeIndex={idx * 2 + 1}
							behavior={unit.behavior}
							{handleDelete}
							onUpdateBehavior={handleUpdateBehavior}
						/>
					{:else}
						<FXNode
							nodeIndex={idx * 2 + 1}
							behavior={unit.behavior}
							{handleDelete}
							onUpdateBehavior={handleUpdateBehavior}
						/>
					{/if}
				{/snippet}
			</DraggableContainer>
			<DraggableContainer mergedMode={true} startX={500} startY={75 + 350 * idx}>
				{#snippet children()}
					<ViewerNode nodeIndex={(idx + 1) * 2} output={unit.cachedOutput}></ViewerNode>
				{/snippet}
			</DraggableContainer>
		{/each}

		<!-- Connection lines SVG -->
		<ConnectionLines />
		<div class="right-8 fixed bottom-2 flex items-center justify-center gap-8 text-nowrap">
			<button
				class="button-1"
				onclick={() => {
					pushUnit(editorState, createNewHSLBehavior());
				}}>Add Adjustment</button
			>
			<button
				class="button-1"
				onclick={() => {
					pushUnit(editorState, createNewDotBehavior());
				}}>Add FX</button
			>
		</div>
	</div>
</main>
