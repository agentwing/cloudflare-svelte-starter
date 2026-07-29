import { createAuth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

const AUTH_PATH = '/api/auth';

function applySecurityHeaders(response: Response): Response {
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set(
		'Permissions-Policy',
		'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()'
	);
	return response;
}

export const handle: Handle = async ({ event, resolve }) => {
	const env = event.platform?.env;
	if (!env) {
		throw new Error(
			'Cloudflare bindings are unavailable. Run this application with `pnpm worker:dev`.'
		);
	}
	if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
		throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.');
	}

	const auth = createAuth(env);
	event.locals.auth = auth;

	if (event.url.pathname === AUTH_PATH || event.url.pathname.startsWith(`${AUTH_PATH}/`)) {
		return applySecurityHeaders(await auth.handler(event.request));
	}

	event.locals.session = await auth.api.getSession({
		headers: event.request.headers
	});

	return applySecurityHeaders(await resolve(event));
};
