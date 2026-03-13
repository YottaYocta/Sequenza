<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<div class="flex items-center justify-center p-4">
	<div class="w-full max-w-2xl">
		<h1 class="text-3xl font-medium tracking-[-0.15rem] mb-8 text-center">Explore</h1>

		<div class="font-mono text-sm">
			{#each data.users as user, userIndex}
				<div class="mb-4">
					<!-- User line with tree structure -->
					<div class="flex items-start">
						<span class="text-neutral-400 mr-2">
							{userIndex === data.users.length - 1 ? '└──' : '├──'}
						</span>
						<span class="font-medium">{user.name}</span>
					</div>

					<!-- Patches for this user -->
					{#each user.patches as patch, patchIndex}
						<div class="flex items-start ml-4">
							<span class="text-neutral-400 mr-2">
								{userIndex === data.users.length - 1 ? '    ' : '│   '}
								{patchIndex === user.patches.length - 1 ? '└──' : '├──'}
							</span>
							<a href={`/patch/${patch.id}`} class="hover:underline text-blue-600">
								{patch.name}
							</a>
						</div>
					{/each}

					<!-- Show message if user has no patches -->
					{#if user.patches.length === 0}
						<div class="flex items-start ml-4">
							<span class="text-neutral-400 mr-2">
								{userIndex === data.users.length - 1 ? '    ' : '│   '}
								└──
							</span>
							<span class="text-neutral-400 italic">No patches</span>
						</div>
					{/if}
				</div>
			{/each}

			<!-- Show message if no users exist -->
			{#if data.users.length === 0}
				<p class="text-neutral-500 text-center">No users found</p>
			{/if}
		</div>
	</div>
</div>
