<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let mode = $state<'sign-in' | 'sign-up'>('sign-up');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let message = $state('');
	let submitting = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		message = '';
		submitting = true;

		const result =
			mode === 'sign-up'
				? await authClient.signUp.email({ name, email, password })
				: await authClient.signIn.email({ email, password });

		submitting = false;
		if (result.error) {
			message = result.error.message ?? 'Authentication failed. Please try again.';
			return;
		}

		await goto(mode === 'sign-up' ? resolve('/onboarding') : resolve('/app'));
	}
</script>

<svelte:head>
	<title>{mode === 'sign-up' ? 'Create account' : 'Sign in'}</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
	<section class="w-full space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
		<header class="space-y-2">
			<h1 class="text-2xl font-semibold">
				{mode === 'sign-up' ? 'Create your account' : 'Welcome back'}
			</h1>
			<p class="text-sm text-muted-foreground">
				{mode === 'sign-up'
					? 'Start with a secure organization workspace.'
					: 'Sign in to continue to your organization.'}
			</p>
		</header>

		<form class="space-y-4" onsubmit={submit}>
			{#if mode === 'sign-up'}
				<label class="grid gap-1.5 text-sm font-medium">
					Name
					<input
						class="h-10 rounded-lg border border-input bg-background px-3 font-normal"
						autocomplete="name"
						bind:value={name}
						required
					/>
				</label>
			{/if}
			<label class="grid gap-1.5 text-sm font-medium">
				Email
				<input
					class="h-10 rounded-lg border border-input bg-background px-3 font-normal"
					type="email"
					autocomplete="email"
					bind:value={email}
					required
				/>
			</label>
			<label class="grid gap-1.5 text-sm font-medium">
				Password
				<input
					class="h-10 rounded-lg border border-input bg-background px-3 font-normal"
					type="password"
					autocomplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
					minlength="8"
					bind:value={password}
					required
				/>
			</label>

			{#if message}
				<p class="text-sm text-destructive" role="alert">{message}</p>
			{/if}

			<Button class="w-full" type="submit" disabled={submitting}>
				{submitting ? 'Working…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
			</Button>
		</form>

		<button
			class="w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
			type="button"
			onclick={() => {
				mode = mode === 'sign-up' ? 'sign-in' : 'sign-up';
				message = '';
			}}
		>
			{mode === 'sign-up' ? 'Already have an account? Sign in' : 'Need an account? Create one'}
		</button>
	</section>
</main>
