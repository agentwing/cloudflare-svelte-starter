PRAGMA foreign_keys = ON;

CREATE TABLE user (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	emailVerified INTEGER NOT NULL DEFAULT 0,
	image TEXT,
	createdAt TEXT NOT NULL,
	updatedAt TEXT NOT NULL
);

CREATE TABLE session (
	id TEXT PRIMARY KEY NOT NULL,
	expiresAt TEXT NOT NULL,
	token TEXT NOT NULL UNIQUE,
	createdAt TEXT NOT NULL,
	updatedAt TEXT NOT NULL,
	ipAddress TEXT,
	userAgent TEXT,
	userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
	activeOrganizationId TEXT
);
CREATE INDEX session_userId_idx ON session(userId);

CREATE TABLE account (
	id TEXT PRIMARY KEY NOT NULL,
	accountId TEXT NOT NULL,
	providerId TEXT NOT NULL,
	userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
	accessToken TEXT,
	refreshToken TEXT,
	idToken TEXT,
	accessTokenExpiresAt TEXT,
	refreshTokenExpiresAt TEXT,
	scope TEXT,
	password TEXT,
	createdAt TEXT NOT NULL,
	updatedAt TEXT NOT NULL
);
CREATE INDEX account_userId_idx ON account(userId);

CREATE TABLE verification (
	id TEXT PRIMARY KEY NOT NULL,
	identifier TEXT NOT NULL,
	value TEXT NOT NULL,
	expiresAt TEXT NOT NULL,
	createdAt TEXT NOT NULL,
	updatedAt TEXT NOT NULL
);
CREATE INDEX verification_identifier_idx ON verification(identifier);

CREATE TABLE organization (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	slug TEXT NOT NULL UNIQUE,
	logo TEXT,
	createdAt TEXT NOT NULL,
	metadata TEXT
);
CREATE INDEX organization_slug_idx ON organization(slug);

CREATE TABLE member (
	id TEXT PRIMARY KEY NOT NULL,
	organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
	userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
	role TEXT NOT NULL DEFAULT 'member',
	createdAt TEXT NOT NULL,
	UNIQUE (organizationId, userId)
);
CREATE INDEX member_organizationId_idx ON member(organizationId);
CREATE INDEX member_userId_idx ON member(userId);

CREATE TABLE invitation (
	id TEXT PRIMARY KEY NOT NULL,
	organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
	email TEXT NOT NULL,
	role TEXT,
	status TEXT NOT NULL DEFAULT 'pending',
	expiresAt TEXT NOT NULL,
	createdAt TEXT NOT NULL,
	inviterId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);
CREATE INDEX invitation_organizationId_idx ON invitation(organizationId);
CREATE INDEX invitation_email_idx ON invitation(email);
