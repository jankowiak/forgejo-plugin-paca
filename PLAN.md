# paca-plugin-forgejo

## Requirements

### Functional
- User configures a Forgejo instance (PAT + OAuth2)
- User links Forgejo repositories to a project
- PRs, issues, milestones, releases, and branches are linked to tasks
- Webhooks receive push, pull_request, issue, release, check_run events
- Clone URLs use PAT-based HTTP(S) (same as GitHub plugin)

### Non-Functional
- **Performance**: Response time < 500ms for API calls (proxied through paca.fetch)
- **Security**: All tokens encrypted with AES-256-GCM
- **Reliability**: Best-effort webhook deletion on unlink

### Constraints
- Built with `plugin-sdk-go` as a WASI/WASM plugin
- Frontend is a Module Federation remote (Vite + React + TanStack Query)
- MCP tools bundle for AI/tooling integrations
- Must coexist with `com.paca.github` plugin

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Paca Host                             │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Plugin Registry                         │   │
│  │                                                   │   │
│  │  ┌──────────────────────────────────────────┐     │   │
│  │  │  paca-plugin-github                      │     │   │
│  │  │  com.paca.github                          │     │   │
│  │  │  Backend: github.wasm                    │     │   │
│  │  │  Frontend: GitHubSettingsTab             │     │   │
│  │  └──────────────────────────────────────────┘     │   │
│  │                                                   │   │
│  │  ┌──────────────────────────────────────────┐     │   │
│  │  │  paca-plugin-forgejo                     │     │   │
│  │  │  com.paca.forgejo                        │     │   │
│  │  │  Backend: forgejo.wasm                   │     │   │
│  │  │  Frontend: ForgejoSettingsTab            │     │   │
│  │  └──────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌───────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │  Frontend │────▶│  Plugin API │────▶│  WASM ls    │  │
│  └───────────┘     │  /plugins/  │     └─────────────┘  │
│                    │  com.paca.* │     ┌─────────────┐  │
│                    └─────────────┘     │  paca.fetch │  │
│                                        └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Adapter Layer Design

The key insight is that GitHub and Forgejo share a **common API surface** despite different HTTP semantics. We model this with a Go-style interface:

```go
// Provider interface captures all differences between GitHub and Forgejo.
type Provider interface {
    Name() string           // "github" | "forgejo"
    CloneURL(owner, repo string) string

    // Token auth helpers
    AuthHeaders(token string) map[string]string
    ValidateToken(ctx, token) (string, error) // returns login name

    // Token creation
    CreateToken(ctx, username, password string) (token, err)

    // Repositories
    ListRepositories(ctx, token) ([]Repo, error)
    GetRepo(ctx, token, owner, repo string) (*Repo, error)

    // Webhooks
    CreateWebhook(ctx, token, owner, repo, secret, url string, events []string) (int64, error)
    DeleteWebhook(ctx, token, owner, repo, hookID int64) error
    WebhookEventName(eventType string) string // normalize event names
    VerifyWebhookSignature(secret, rawBody, header string) error

    // PRs
    GetPR(ctx, token, owner, repo string, number int) (*PR, error)
    CreatePR(ctx, token, owner, repo, title, head, base, body string) (*PR, error)
}
```

## Key Decisions

### ADR-001: Runtime Adapter Pattern
**Decision:** One WASM binary with a runtime-selected provider.

**Rationale:** GitHub and Forgejo share 80% of the same logic (DB schema, PR linking, branch creation). The adapter pattern lets us share code while only changing the 20% that differs.

**Trade-offs:**
- Positive: Single codebase, one CI pipeline, minimal duplication
- Negative: Slightly more complex dispatch logic

### ADR-002: Separate Plugin Registry Entries
**Decision:** `com.paca.github` and `com.paca.forgejo` are separate plugins.

**Rationale:** They need separate `plugin.json` (different allowed-outbound-domains, different config keys, different frontend entries). The adapter is shared only in logic, not in plugin structure.

### ADR-003: Forgejo Native Repository Identity
**Decision:** Store Forgejo URLs natively (`forgejo.example.org/owner/repo`).

**Rationale:** When repos are mirrored, the original GitHub URL is irrelevant to Forgejo operations.

### ADR-004: PAT + OAuth2 Both Supported
**Decision:** Both authentication flows available.

**Rationale:** OAuth2 is the only way for users who don't want to store a PAT. PAT is simpler for self-hosted setups without OAuth client registration.

## Database Schema

```sql
-- Same structure as github, but provider-specific columns
forgejo_integrations
  id UUID PK
  project_id UUID UNIQUE
  provider TEXT -- "pat" or "oauth2"
  access_token_enc TEXT
  oauth_client_id TEXT
  oauth_client_secret_enc TEXT
  oauth_instance_url TEXT
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

forgejo_repositories
  id UUID PK
  project_id UUID
  integration_id UUID
  owner TEXT
  repo_name TEXT
  full_name TEXT
  instance_url TEXT -- "forgejo.example.org"
  default_branch TEXT
  webhook_id BIGINT
  webhook_secret_enc TEXT
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

forgejo_pull_requests
  -- same as github_pull_requests

forgejo_task_pr_links
  -- same as github_task_pr_links

forgejo_task_branches
  -- same as github_task_branches
```

## Frontend Structure

```
frontend/
├── src/
│   ├── ForgejoSettingsTab.tsx  # Provider-specific settings
│   ├── ForgejoTaskSection.tsx  # Task detail section
│   └── index.ts
```

## Implementation Phases

### Phase 1: Scaffolding (1-2 days)
- [ ] Create `plugin.json` for `com.paca.forgejo`
- [ ] Set up Go module with `plugin-sdk-go`
- [ ] Configure WASM build target
- [ ] Create `plugin.go` with route registration
- [ ] Set up `main.go` with WASI entry point

### Phase 2: Core API Client (2-3 days)
- [ ] Define `Provider` interface
- [ ] Implement GitHub adapter (extract existing logic)
- [ ] Implement Forgejo adapter
- [ ] Add runtime dispatcher
- [ ] Write tests for both adapters

### Phase 3: Integration Layer (2-3 days)
- [ ] PAT integration flow (same as GitHub)
- [ ] OAuth2 integration flow (Forgejo-specific)
- [ ] Repository linking
- [ ] Webhook creation/deletion

### Phase 4: Webhook Handler (2-3 days)
- [ ] Forgejo webhook verification
- [ ] Event normalization (Forgejo → common)
- [ ] PR/issue auto-linking
- [ ] Branch auto-linking

### Phase 5: Frontend (3-4 days)
- [ ] `ForgejoSettingsTab` component
- [ ] PAT/OAuth2 config forms
- [ ] Repository selector
- [ ] `ForgejoTaskSection` component

### Phase 6: MCP Tools (1-2 days)
- [ ] Extract common MCP tools
- [ ] Forgejo-specific MCP tools
- [ ] Integration management tools

### Phase 7: CI/CD (1 day)
- [ ] Backend CI workflow
- [ ] Frontend CI workflow
- [ ] MCP CI workflow
- [ ] Release workflow (tag-based)

### Phase 8: Polish (1-2 days)
- [ ] E2E testing
- [ ] Error messages
- [ ] README
- [ ] Release v0.1.0

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Forgejo API changes between versions | Medium | Pin to specific Forgejo version in docs |
| OAuth2 scope differences | Medium | Document required scopes per Forgejo version |
| Webhook payload inconsistencies | Low | Test against common Forgejo versions |
| Migration edge cases | Low | Coexistence means no migration needed |

## Dependencies

- `plugin-sdk-go` — Go SDK for Paca plugins
- Forgejo SDK (`code.gitea.io/sdk/gitea`) — primary client for Forgejo API calls
- Vite + React + TanStack Query — frontend
- Bun — build tooling

## Notes

- **OAuth2 tokens have full admin access** — Forgejo currently does not support scoped OAuth2 tokens, so the OAuth client must be treated as a privileged credential.

- **Forgejo forked from Gitea v1.14** — some newer Gitea API endpoints may not be available in older Forgejo versions.
