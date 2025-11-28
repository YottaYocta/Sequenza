<script lang="ts">
	import type { EditorState } from '$lib/processing/EditorState';
	import { serializeEditorState } from '$lib/processing/EditorState';

	const { editorState }: { editorState: EditorState } = $props();

	const handleSavePatch = async () => {
		const patch = serializeEditorState(editorState);
		const patchJson = JSON.stringify($state.snapshot(patch));

		// Save to database via API
		try {
			const response = await fetch('/api/patches', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: patch.name,
					jsonData: patchJson
				})
			});

			if (response.redirected) {
				// User not logged in, redirect to login
				window.location.href = response.url;
				return;
			}

			if (!response.ok) {
				throw new Error('Failed to save patch to server');
			}

			const result = await response.json();
			console.log('Patch saved to database:', result);
			alert('Patch saved successfully!');
		} catch (error) {
			console.error('Error saving patch to server:', error);
			alert('Failed to save patch to server. Check console for details.');
		}
	};
</script>

<div class="bg-white p-4">
	<button class="button-1 text-nowrap h-min" onclick={handleSavePatch}> Save Patch </button>
</div>
