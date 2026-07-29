CREATE TABLE project (
	id TEXT PRIMARY KEY NOT NULL,
	organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	created_by TEXT NOT NULL REFERENCES user(id),
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE INDEX project_organization_updated_idx
	ON project (organization_id, updated_at DESC, id DESC);
