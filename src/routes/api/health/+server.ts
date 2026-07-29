import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const startedAt = Date.now();
	if (!platform?.env.DB) {
		return json({ ok: false, database: 'unavailable' }, { status: 503 });
	}

	try {
		await platform.env.DB.prepare('SELECT 1 AS ok').first();
		return json({
			ok: true,
			database: 'ready',
			latencyMs: Date.now() - startedAt
		});
	} catch {
		return json(
			{
				ok: false,
				database: 'unavailable',
				latencyMs: Date.now() - startedAt
			},
			{ status: 503 }
		);
	}
};
