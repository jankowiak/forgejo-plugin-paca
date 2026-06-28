-- 0001_create_forgejo_tables.sql
-- Creates the Forgejo integration tables in the plugin schema.

CREATE TABLE IF NOT EXISTS forgejo_integrations (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id        UUID        NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    provider          TEXT        NOT NULL DEFAULT 'pat',
    access_token_enc  TEXT        NOT NULL DEFAULT '',
    oauth_client_id   TEXT        NOT NULL DEFAULT '',
    oauth_client_secret_enc TEXT NOT NULL DEFAULT '',
    oauth_instance_url TEXT       NOT NULL DEFAULT '',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forgejo_integrations_project_id
    ON forgejo_integrations (project_id);

CREATE TABLE IF NOT EXISTS forgejo_repositories (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id        UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    integration_id    UUID        NOT NULL REFERENCES forgejo_integrations(id) ON DELETE CASCADE,
    owner             TEXT        NOT NULL,
    repo_name         TEXT        NOT NULL,
    full_name         TEXT        NOT NULL,
    instance_url      TEXT        NOT NULL DEFAULT '',
    default_branch    TEXT        NOT NULL DEFAULT 'main',
    webhook_id        BIGINT      NOT NULL DEFAULT 0,
    webhook_secret_enc TEXT       NOT NULL DEFAULT '',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, full_name)
);

CREATE INDEX IF NOT EXISTS idx_forgejo_repositories_project_id
    ON forgejo_repositories (project_id);
CREATE INDEX IF NOT EXISTS idx_forgejo_repositories_full_name
    ON forgejo_repositories (full_name);

CREATE TABLE IF NOT EXISTS forgejo_pull_requests (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    repo_id     UUID        NOT NULL REFERENCES forgejo_repositories(id) ON DELETE CASCADE,
    pr_number   INT         NOT NULL,
    forgejo_pr_id BIGINT    NOT NULL,
    title       TEXT        NOT NULL DEFAULT '',
    state       TEXT        NOT NULL DEFAULT 'open',
    html_url    TEXT        NOT NULL DEFAULT '',
    head_branch TEXT        NOT NULL DEFAULT '',
    base_branch TEXT        NOT NULL DEFAULT '',
    author      TEXT        NOT NULL DEFAULT '',
    merged_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (repo_id, pr_number)
);

CREATE INDEX IF NOT EXISTS idx_forgejo_pull_requests_repo_id
    ON forgejo_pull_requests (repo_id);

CREATE TABLE IF NOT EXISTS forgejo_task_pr_links (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    pull_request_id UUID       NOT NULL REFERENCES forgejo_pull_requests(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, pull_request_id)
);

CREATE INDEX IF NOT EXISTS idx_forgejo_task_pr_links_task_id
    ON forgejo_task_pr_links (task_id);

CREATE TABLE IF NOT EXISTS forgejo_task_branches (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    repo_id     UUID        NOT NULL REFERENCES forgejo_repositories(id) ON DELETE CASCADE,
    branch_name TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, repo_id, branch_name)
);

CREATE INDEX IF NOT EXISTS idx_forgejo_task_branches_task_id
    ON forgejo_task_branches (task_id);
