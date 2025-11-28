<script lang="ts">
	import PatchEditor from '$lib/components/PatchEditor.svelte';
	import type { Patch } from '$lib/processing/Patch';
	const handleSavePatch = async (patch: Patch) => {
		const patchJson = JSON.stringify($state.snapshot(patch));

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
		} catch (error) {
			console.error('Error saving patch to server:', error);
			alert('Failed to save patch to server. Check console for details.');
		}
	};
</script>

<PatchEditor {handleSavePatch} />
