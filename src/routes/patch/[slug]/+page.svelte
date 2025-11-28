<script lang="ts">
	import PatchEditor from '$lib/components/PatchEditor.svelte';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<PatchEditor initialPatch={data.patch}></PatchEditor>
