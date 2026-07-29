<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data } = $props();
	let name = $state('');
	let slug = $state('');
	let message = $state('');
	let submitting = $state(false);

	function slugify(value: string) {
		return value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		message = '';
		submitting = true;

		const organizationSlug = slugify(slug || name);
		const created = await authClient.organization.create({
			name,
			slug: organizationSlug
		});
		if (created.error || !created.data) {
			submitting = false;
			message = created.error?.message ?? 'The organization could not be created.';
			return;
		}

		const activated = await authClient.organization.setActive({
			organizationId: created.data.id
		});
		submitting = false;
		if (activated.error) {
			message = activated.error.message ?? 'The organization could not be activated.';
			return;
		}

		await goto(resolve('/app'));
	}
</script>

<svelte:head>
	<title>Create organization</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
	<section class="w-full space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
		<header class="space-y-2">
			<p class="text-sm text-muted-foreground">{data.user.email}</p>
			<h1 class="text-2xl font-semibold">Create your organization</h1>
			<p class="text-sm text-muted-foreground">
				Your product data will be isolated inside this organization.
			</p>
		</header>

		<form class="space-y-4" onsubmit={submit}>
			<label class="grid gap-1.5 text-sm font-medium">
				Organization name
				<input
					class="h-10 rounded-lg border border-input bg-background px-3 font-normal"
					autocomplete="organization"
					bind:value={name}
					oninput={() => {
						if (!slug) slug = slugify(name);
					}}
					required
				/>
			</label>
			<label class="grid gap-1.5 text-sm font-medium">
				Organization URL
				<div class="flex h-10 items-center rounded-lg border border-input bg-background px-3">
					<span class="text-muted-foreground">app.example.com/</span>
					<input
						class="min-w-0 flex-1 bg-transparent font-normal outline-none"
						pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
						bind:value={slug}
						required
					/>
				</div>
			</label>

			{#if message}
				<p class="text-sm text-destructive" role="alert">{message}</p>
			{/if}

			<Button class="w-full" type="submit" disabled={submitting}>
				{submitting ? 'Creating…' : 'Create organization'}
			</Button>
		</form>
	</section>
</main>
