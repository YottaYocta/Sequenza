<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<div class="flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<h1 class="text-3xl font-medium tracking-[-0.15rem] mb-8 text-center">Sign Up</h1>

		{#if form?.errors}
			<div class="mb-4 p-3 border border-red-600 bg-red-50 text-red-600 text-sm">
				{#each form.errors as error}
					<p>{error}</p>
				{/each}
			</div>
		{/if}

		<form method="POST" class="flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<label for="email" class="text-sm">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					value={form?.email ?? ''}
					class="input-1 px-3 py-2"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label for="password" class="text-sm">Password</label>
				<input type="password" id="password" name="password" required class="input-1 px-3 py-2" />
			</div>

			<div class="flex flex-col gap-1">
				<label for="confirmPassword" class="text-sm">Confirm Password</label>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					required
					class="input-1 px-3 py-2"
				/>
			</div>

			<button type="submit" class="button-1 border border-black px-4 py-2 mt-4">
				Create Account
			</button>
		</form>

		<p class="text-sm text-center mt-6">
			Already have an account?
			<a href="/login" class="button-1">Login</a>
		</p>
	</div>
</div>
