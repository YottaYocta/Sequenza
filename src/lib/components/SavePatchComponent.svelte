<script lang="ts">
	import type { EditorState } from '$lib/processing/EditorState';
	import { serializeEditorState } from '$lib/processing/EditorState';

	const { editorState }: { editorState: EditorState } = $props();

	const STORAGE_KEY = 'sequenza-patch';

	const handleSavePatch = () => {
		const patch = serializeEditorState(editorState);
		const patchJson = JSON.stringify($state.snapshot(patch));

		// Save to localStorage
		localStorage.setItem(STORAGE_KEY, patchJson);

		console.log('Patch saved to localStorage:', $state.snapshot(patch));
	};
</script>

<div class="bg-white p-4">
	<button class="button-1 text-nowrap h-min" onclick={handleSavePatch}> Save Patch </button>
</div>
