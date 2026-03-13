<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<div class="flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<h1 class="text-3xl font-medium tracking-[-0.15rem] mb-8 text-center">{data.name}'s Patches</h1>
	</div>
</div>
