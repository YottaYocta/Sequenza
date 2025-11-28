<script lang="ts">
	import type { PageProps, PageServerData } from './$types';

	const { data }: PageProps = $props();
</script>

<div class="flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<h1 class="text-3xl font-medium tracking-[-0.15rem] mb-8 text-center">Explore</h1>

		<ul>
			{#each data.users as user}
				<li>
					<a href={`patches/${user.id}`} class="button-1">{user.name}</a>
				</li>
			{/each}
		</ul>
	</div>
</div>
