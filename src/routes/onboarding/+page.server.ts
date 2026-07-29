import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.session) {
		redirect(303, '/sign-in');
	}
	if (locals.session.session.activeOrganizationId) {
		redirect(303, '/app');
	}

	return {
		user: locals.session.user
	};
};
