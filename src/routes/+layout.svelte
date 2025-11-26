<script lang="ts">
	import './global.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="w-full border-b p-2 flex items-center justify-center">
	<nav class="w-full max-w-3xl px-6">
		<ul class="w-full h-min flex justify-between items-baseline">
			<li>
				<a href="/">
					<h1 class="text-2xl tracking-[-0.15rem] font-medium">SEQUENZA</h1>
				</a>
			</li>
			<span class="flex justify-start items-baseline gap-8">
				<li>
					<a href="/explore" class="button-1">Explore</a>
				</li>
				<li>
					<a href="/signup" class="button-1">Sign Up</a>
				</li>
				<li>
					<a href="/login" class="button-1">Login</a>
				</li>
			</span>
		</ul>
	</nav>
</header>
{@render children()}
