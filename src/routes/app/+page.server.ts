import { listProjects } from '$lib/server/projects';
import { requireTenantScope } from '$lib/server/tenancy';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.session) {
		redirect(303, '/sign-in');
	}
	if (!platform?.env.DB) {
		throw new Error('D1 binding is unavailable.');
	}

	const scope = await requireTenantScope(locals, platform.env.DB);
	return {
		organizationId: scope.organizationId,
		projects: await listProjects(platform.env.DB, scope),
		user: locals.session.user
	};
};
