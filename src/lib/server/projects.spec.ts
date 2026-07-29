import { describe, expect, it, vi } from 'vitest';
import { listProjects } from './projects';
import type { OrganizationId, TenantScope } from './tenancy';

describe('listProjects', () => {
	it('binds the active organization to every list query', async () => {
		const all = vi.fn().mockResolvedValue({ results: [] });
		const bind = vi.fn().mockReturnValue({ all });
		const prepare = vi.fn().mockReturnValue({ bind });
		const db = { prepare } as unknown as D1Database;
		const scope: TenantScope = {
			organizationId: 'org_current' as OrganizationId,
			userId: 'user_current'
		};

		await listProjects(db, scope);

		expect(prepare).toHaveBeenCalledOnce();
		expect(prepare.mock.calls[0][0]).toContain('WHERE organization_id = ?');
		expect(bind).toHaveBeenCalledWith('org_current');
		expect(all).toHaveBeenCalledOnce();
	});
});
