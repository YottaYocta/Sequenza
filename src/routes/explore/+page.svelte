<script lang="ts">
	const { data } = $props();
</script>

<div class="flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<h1 class="text-3xl font-medium tracking-[-0.15rem] mb-8 text-center">Explore</h1>

		<ul>
			{#each data.users as user}
				<li>
					<p>{user}</p>
				</li>
			{/each}
		</ul>
	</div>
</div>
