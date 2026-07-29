// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			auth: import('$lib/server/auth').Auth;
			session: import('$lib/server/auth').AuthSession;
		}

		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
	}

	interface Env {
		BETTER_AUTH_SECRET: string;
		BETTER_AUTH_URL: string;
		DB: D1Database;
	}
}

export {};
