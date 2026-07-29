import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins/organization';

export function createAuth(env: Env) {
	return betterAuth({
		appName: 'Cloudflare Svelte starter',
		baseURL: env.BETTER_AUTH_URL,
		database: env.DB,
		secret: env.BETTER_AUTH_SECRET,
		emailAndPassword: {
			enabled: true,
			revokeSessionsOnPasswordReset: true
		},
		plugins: [
			organization({
				allowUserToCreateOrganization: true,
				membershipLimit: 100
			})
		],
		rateLimit: {
			enabled: true,
			window: 60,
			max: 100,
			storage: 'database'
		},
		trustedOrigins: [env.BETTER_AUTH_URL],
		advanced: {
			useSecureCookies: env.BETTER_AUTH_URL.startsWith('https://'),
			ipAddress: {
				ipAddressHeaders: ['cf-connecting-ip']
			}
		}
	});
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Awaited<ReturnType<Auth['api']['getSession']>>;
