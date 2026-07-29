<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>App · Cloudflare Svelte starter</title>
</svelte:head>

<main class="mx-auto min-h-screen max-w-5xl space-y-8 px-6 py-12">
	<header class="space-y-2">
		<p class="text-sm text-muted-foreground">Signed in as {data.user.email}</p>
		<h1 class="text-3xl font-semibold tracking-tight">Projects</h1>
	</header>

	{#if data.projects.length === 0}
		<section class="rounded-xl border border-border bg-card p-8">
			<h2 class="font-medium">Your organization is ready.</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				Replace this tenant-scoped example with the first useful object in your product.
			</p>
		</section>
	{:else}
		<ul class="grid gap-3">
			{#each data.projects as project (project.id)}
				<li class="rounded-xl border border-border bg-card p-4">
					<p class="font-medium">{project.name}</p>
					<p class="text-sm text-muted-foreground">{project.id}</p>
				</li>
			{/each}
		</ul>
	{/if}
</main>
