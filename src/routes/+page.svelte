<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<svelte:head>
	<title>Cloudflare Svelte starter</title>
	<meta
		name="description"
		content="A production-oriented SvelteKit and Cloudflare Workers starter."
	/>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
	<section class="max-w-2xl space-y-6">
		<p class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
			SvelteKit · Cloudflare Workers
		</p>
		<h1 class="text-4xl font-semibold tracking-tight sm:text-6xl">
			A secure starting point for your next product.
		</h1>
		<p class="text-lg text-muted-foreground">
			Authentication, organization tenancy, D1 persistence, health checks, tests, and deployment
			configuration are ready to adapt.
		</p>
		<div class="flex gap-3">
			<Button href="/sign-in">Get started</Button>
			<Button href="/api/health" variant="outline">Check health</Button>
		</div>
	</section>
</main>
