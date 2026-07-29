import { error } from '@sveltejs/kit';

declare const organizationIdBrand: unique symbol;
export type OrganizationId = string & { readonly [organizationIdBrand]: true };

export interface TenantScope {
	organizationId: OrganizationId;
	userId: string;
}

interface MembershipRow {
	id: string;
}

export async function requireTenantScope(locals: App.Locals, db: D1Database): Promise<TenantScope> {
	const session = locals.session;
	if (!session) {
		error(401, 'Sign in required.');
	}

	const organizationId = session.session.activeOrganizationId;
	if (!organizationId) {
		error(409, 'Choose or create an organization first.');
	}

	const membership = await db
		.prepare(
			`SELECT id
			 FROM member
			 WHERE organizationId = ? AND userId = ?
			 LIMIT 1`
		)
		.bind(organizationId, session.user.id)
		.first<MembershipRow>();

	if (!membership) {
		error(403, 'The active organization is not accessible.');
	}

	return {
		organizationId: organizationId as OrganizationId,
		userId: session.user.id
	};
}
