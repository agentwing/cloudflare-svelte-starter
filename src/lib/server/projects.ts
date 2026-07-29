import type { TenantScope } from '$lib/server/tenancy';

export interface Project {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

interface ProjectRow {
	id: string;
	name: string;
	created_at: string;
	updated_at: string;
}

function mapProject(row: ProjectRow): Project {
	return {
		id: row.id,
		name: row.name,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export async function listProjects(db: D1Database, scope: TenantScope): Promise<Project[]> {
	const result = await db
		.prepare(
			`SELECT id, name, created_at, updated_at
			 FROM project
			 WHERE organization_id = ?
			 ORDER BY updated_at DESC, id DESC`
		)
		.bind(scope.organizationId)
		.all<ProjectRow>();

	return result.results.map(mapProject);
}

export async function createProject(
	db: D1Database,
	scope: TenantScope,
	input: { id: string; name: string }
): Promise<Project> {
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO project (id, organization_id, name, created_by, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(input.id, scope.organizationId, input.name, scope.userId, now, now)
		.run();

	const project = await db
		.prepare(
			`SELECT id, name, created_at, updated_at
			 FROM project
			 WHERE id = ? AND organization_id = ?
			 LIMIT 1`
		)
		.bind(input.id, scope.organizationId)
		.first<ProjectRow>();

	if (!project) {
		throw new Error('Project was not found in the active organization.');
	}
	return mapProject(project);
}
