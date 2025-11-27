<div class="flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<h1 class="text-3xl font-medium tracking-[-0.15rem] mb-8 text-center">Login</h1>

		<form class="flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<label for="email" class="text-sm">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					class="input-1 px-3 py-2"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label for="password" class="text-sm">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					class="input-1 px-3 py-2"
				/>
			</div>

			<button type="submit" class="button-1 border border-black px-4 py-2 mt-4">
				Login
			</button>
		</form>

		<p class="text-sm text-center mt-6">
			Don't have an account?
			<a href="/signup" class="button-1">Sign Up</a>
		</p>
	</div>
</div>
