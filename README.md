# com.paca.forgejo

First-party Paca plugin that integrates Forgejo repositories, pull requests, and branches with Paca projects and tasks.

---

## Architecture

The plugin follows the standard three-part plugin structure:

```text
forgejo/
├── backend/   - Go WASM plugin (runs inside the API host)
├── frontend/  - React micro-frontend (Module Federation remote)
└── mcp/       - MCP tools bundle for AI/tooling integrations
```

### Backend (backend/)

- Written in Go, compiled to wasip1/wasm for production.
- Registered as com.paca.forgejo in the plugin registry.
- Owns its database schema (plugin_data_com_paca_forgejo) and runs its own migration on startup.
- Stores Forgejo PATs, instance URLs, and webhook secrets encrypted with AES-256-GCM.
- Creates and verifies Forgejo webhooks for linked repositories.
- Handles task/project cleanup on task.deleted and project.deleted events.

### Frontend (frontend/)

- Vite + React + TanStack Query.
- Exposed as a Module Federation remote (com_paca_forgejo).
- Mounted at:
  - project.settings.tab (ForgejoSettingsTab)
  - task.detail.section (ForgejoTaskSection)
- Communicates with backend via plugin API routes under /api/v1/plugins/com.paca.forgejo/projects/:projectId/...

### MCP (mcp/)

- Built with @paca-ai/plugin-sdk-mcp.
- Published as an ESM bundle (mcp.js).
- Exposes tools for integration management, repository linking, PR linking, and branch operations.

---

## Required Configuration

The backend uses the following config keys:

- ENCRYPTION_KEY: 64 hex chars (32-byte key) used for AES-256-GCM encryption of tokens/secrets.
- PUBLIC_URL: public base URL of the Paca server, used to build the webhook callback URL.

Without PUBLIC_URL, linking repositories will fail because webhook creation requires a reachable callback URL.

---

## API Endpoints

All routes are prefixed with /projects/:projectId by the host.
The caller must be an authenticated member of the project unless noted otherwise.

| Method | Path | Description |
|--------|------|-------------|
| GET | /integration | Get integration status for the current project |
| POST | /integration/token | Set or replace Forgejo PAT |
| DELETE | /integration/token | Delete Forgejo PAT and integration |
| GET | /integration/accessible-repos | List repositories accessible by the token |
| GET | /repositories | List repositories linked to the project |
| POST | /repositories | Link a repository and create webhook |
| DELETE | /repositories/:repoId | Unlink a repository |
| GET | /tasks/:taskId/pull-requests | List pull requests linked to a task |
| POST | /tasks/:taskId/pull-requests | Create PR and link to a task |
| POST | /tasks/:taskId/pull-requests/link | Link an existing PR to a task |
| DELETE | /tasks/:taskId/pull-requests/:prId | Unlink a pull request from a task |
| POST | /tasks/:taskId/branches | Create branch and link it to a task |
| GET | /tasks/:taskId/branches | List branches linked to a task |
| POST | /webhook (public) | Receive Forgejo webhook events |

### Example requests

Set token:

```json
{ "token": "fgp_xxx", "instance_url": "https://forgejo.example.org" }
```

Link repository:

```json
{ "owner": "my-org", "repo_name": "my-repo" }
```

Link PR to task:

```json
{ "repo_id": "550e8400-e29b-41d4-a716-446655440000", "pr_number": 42 }
```

Create branch for task:

```json
{
  "repo_id": "550e8400-e29b-41d4-a716-446655440000",
  "branch_name": "feat/PROJ-42-forgejo-integration",
  "source_branch": "main"
}
```

---

## Forgejo-Specific Differences

- **Instance URL**: Forgejo is self-hosted, so all API calls include an `instance_url`. The token form requires both the PAT and the instance URL.
- **Domain-agnostic PR URLs**: PR URL parsing accepts any host, not just a hardcoded domain.
- **Webhook compatibility**: Supports both `X-Forgejo-Event` and `X-Gitea-Event` headers for backward compatibility.
- **Wildcard outbound domains**: `allowedOutboundDomains` is set to `["*"]` because Forgejo instances run on arbitrary domains.

---

## Webhook Behavior

On linked repositories, Forgejo webhooks are configured for:

- push
- pull_request
- issue
- release
- check_run

Current behavior includes:

- Verifying X-Forgejo-Signature-256 with the stored webhook secret.
- Caching/updating pull request state in plugin tables.
- Auto-linking PRs when opened/reopened from a branch already linked to a task.
- Auto-linking created branches when branch names include task references like PROJ-42.
- Emitting plugin events:
  - forgejo.pr_linked
  - forgejo.pr_created
  - forgejo.branch_linked

---

## Database Schema

Tables live in `plugin_data_com_paca_forgejo` and are created by `backend/migrations/0001_create_forgejo_tables.sql`.

---

## Development

### Backend

```bash
cd backend

# Run tests
go test -v ./...

# Build WASM binary (Go 1.24+)
GOOS=wasip1 GOARCH=wasm go build -buildmode=c-shared -o forgejo.wasm .
```

### Frontend

```bash
cd frontend

# Install dependencies
bun install

# Development build (watch)
bun run dev

# Production build
bun run build
```

### MCP

```bash
cd mcp

# Install dependencies
bun install

# Typecheck
bun run typecheck

# Production build (outputs mcp.js)
bun run build
```

---

## Release (CD)

The release workflow is at `.github/workflows/release.yml`.

It runs on:

- tag push matching v*
- manual workflow_dispatch

The workflow builds backend/frontend/mcp assets, packages migrations and plugin.json, generates SHA256 checksums, and uploads all artifacts to a GitHub Release.
