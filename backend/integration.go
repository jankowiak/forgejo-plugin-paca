package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	plugin "github.com/Paca-AI/plugin-sdk-go"
)

type integrationResponse struct {
	ProjectID string  `json:"project_id"`
	Connected bool    `json:"connected"`
	Provider  string  `json:"provider,omitempty"`
	CreatedAt *string `json:"created_at,omitempty"`
	UpdatedAt *string `json:"updated_at,omitempty"`
}

type accessibleRepoResponse struct {
	FullName      string `json:"full_name"`
	Owner         string `json:"owner"`
	RepoName      string `json:"repo_name"`
	DefaultBranch string `json:"default_branch"`
	Private       bool   `json:"private"`
}

type repositoryResponse struct {
	ID            string `json:"id"`
	ProjectID     string `json:"project_id"`
	Owner         string `json:"owner"`
	RepoName      string `json:"repo_name"`
	FullName      string `json:"full_name"`
	InstanceURL   string `json:"instance_url"`
	DefaultBranch string `json:"default_branch"`
	CloneURL      string `json:"clone_url"`
	WebhookActive bool   `json:"webhook_active"`
	CreatedAt     string `json:"created_at"`
	UpdatedAt     string `json:"updated_at"`
}

type repoCloneInfo struct {
	ID        string `json:"id"`
	FullName  string `json:"full_name"`
	Owner     string `json:"owner"`
	RepoName  string `json:"repo_name"`
	CloneURL  string `json:"clone_url"`
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expires_at"`
}

const forgejoPluginID = "com.paca.forgejo"

func webhookURLFromPublicURL(cfg *plugin.Config, projectID string) (string, error) {
	publicURL, ok := cfg.Get("PUBLIC_URL")
	if !ok || strings.TrimSpace(publicURL) == "" {
		return "", errors.New("PUBLIC_URL is not configured")
	}
	base := strings.TrimRight(strings.TrimSpace(publicURL), "/")
	return fmt.Sprintf("%s/api/v1/plugins/%s/projects/%s/webhook", base, forgejoPluginID, projectID), nil
}

type instanceAndToken struct {
	instanceURL string
	token       string
}

func (p *forgejoPlugin) decryptTokenWithInstance(projectID string) (*instanceAndToken, error) {
	result, err := p.db.Query(
		`SELECT access_token_enc, oauth_instance_url FROM forgejo_integrations WHERE project_id = $1`,
		projectID,
	)
	if err != nil {
		return nil, err
	}
	if len(result.Rows) == 0 {
		return nil, &appError{code: "FORGEJO_INTEGRATION_NOT_FOUND", status: 404, msg: "Forgejo integration not found"}
	}
	sc := newRowScanner(result.Columns, result.Rows[0])
	enc := sc.str("access_token_enc")
	instanceURL := sc.str("oauth_instance_url")
	if enc == "" {
		return nil, &appError{code: "FORGEJO_INTEGRATION_NOT_FOUND", status: 404, msg: "Forgejo integration not found"}
	}
	token, err := p.decrypt(enc)
	if err != nil {
		return nil, err
	}
	return &instanceAndToken{instanceURL: instanceURL, token: token}, nil
}

func (p *forgejoPlugin) decryptToken(projectID string) (string, error) {
	it, err := p.decryptTokenWithInstance(projectID)
	if err != nil {
		return "", err
	}
	return it.token, nil
}

func (p *forgejoPlugin) newClientForProject(projectID string) (*fjClient, error) {
	it, err := p.decryptTokenWithInstance(projectID)
	if err != nil {
		return nil, err
	}
	return newFJClient(it.instanceURL, it.token), nil
}

func (p *forgejoPlugin) getIntegration(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID
	result, err := p.db.Query(
		`SELECT project_id, provider, created_at, updated_at FROM forgejo_integrations WHERE project_id = $1`,
		projectID,
	)
	if err != nil {
		apiError(res, 500, "INTERNAL_ERROR", err.Error())
		return
	}
	if len(result.Rows) == 0 {
		ok(res, integrationResponse{ProjectID: projectID, Connected: false})
		return
	}
	sc := newRowScanner(result.Columns, result.Rows[0])
	ca := sc.str("created_at")
	ua := sc.str("updated_at")
	ok(res, integrationResponse{
		ProjectID: sc.str("project_id"),
		Connected: true,
		Provider:  sc.str("provider"),
		CreatedAt: &ca,
		UpdatedAt: &ua,
	})
}

func (p *forgejoPlugin) setToken(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID

	type bodyT struct {
		Token       string `json:"token"`
		InstanceURL string `json:"instance_url"`
	}
	b, err := plugin.JSONBody[bodyT](req)
	if err != nil || b.Token == "" || b.InstanceURL == "" {
		apiError(res, 400, "BAD_REQUEST", "token and instance_url are required")
		return
	}

	instanceURL := strings.TrimRight(b.InstanceURL, "/")

	fjc := newFJClient(instanceURL, b.Token)
	if err := fjc.validateToken(context.Background()); err != nil {
		var apiErr *fjAPIError
		if errors.As(err, &apiErr) && (apiErr.StatusCode == 401 || apiErr.StatusCode == 403) {
			apiError(res, 422, "FORGEJO_INVALID_TOKEN", "Forgejo token is invalid or expired")
			return
		}
		apiError(res, 502, "INTERNAL_ERROR", fmt.Sprintf("failed to validate token: %s", err))
		return
	}

	enc, err := p.encrypt(b.Token)
	if err != nil {
		apiError(res, 500, "INTERNAL_ERROR", "failed to encrypt token")
		return
	}

	now := nowStr()
	_, err = p.db.Exec(`
		INSERT INTO forgejo_integrations (project_id, provider, access_token_enc, oauth_instance_url, created_at, updated_at)
		VALUES ($1, 'pat', $2, $3, $4, $5)
		ON CONFLICT (project_id) DO UPDATE SET
			access_token_enc = EXCLUDED.access_token_enc,
			oauth_instance_url = EXCLUDED.oauth_instance_url,
			provider = 'pat',
			updated_at = EXCLUDED.updated_at
	`, projectID, enc, instanceURL, now, now)
	if err != nil {
		apiError(res, 500, "INTERNAL_ERROR", err.Error())
		return
	}

	result, qErr := p.db.Query(
		`SELECT project_id, provider, created_at, updated_at FROM forgejo_integrations WHERE project_id = $1`,
		projectID,
	)
	if qErr != nil || len(result.Rows) == 0 {
		ok(res, integrationResponse{ProjectID: projectID, Connected: true})
		return
	}
	sc := newRowScanner(result.Columns, result.Rows[0])
	ca := sc.str("created_at")
	ua := sc.str("updated_at")
	ok(res, integrationResponse{
		ProjectID: sc.str("project_id"),
		Connected: true,
		Provider:  sc.str("provider"),
		CreatedAt: &ca,
		UpdatedAt: &ua,
	})
}

func (p *forgejoPlugin) deleteToken(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID

	it, tokenErr := p.decryptTokenWithInstance(projectID)
	if tokenErr == nil {
		fjc := newFJClient(it.instanceURL, it.token)
		rows, qErr := p.db.Query(
			`SELECT owner, repo_name, webhook_id FROM forgejo_repositories WHERE project_id = $1`,
			projectID,
		)
		if qErr == nil {
			for _, row := range rows.Rows {
				sc := newRowScanner(rows.Columns, row)
				whID := sc.int64Val("webhook_id")
				if whID > 0 {
					_ = fjc.deleteWebhook(context.Background(), sc.str("owner"), sc.str("repo_name"), whID)
				}
			}
		}
	}

	_, execErr := p.db.Exec(`DELETE FROM forgejo_integrations WHERE project_id = $1`, projectID)
	if execErr != nil {
		apiError(res, 500, "INTERNAL_ERROR", execErr.Error())
		return
	}
	noContent(res)
}

func (p *forgejoPlugin) listAccessibleRepos(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID

	fjc, err := p.newClientForProject(projectID)
	if err != nil {
		writeAppError(res, err)
		return
	}

	repos, err := fjc.listRepositories(context.Background())
	if err != nil {
		apiError(res, 502, "INTERNAL_ERROR", fmt.Sprintf("failed to list repositories: %s", err))
		return
	}

	items := make([]accessibleRepoResponse, len(repos))
	for i, r := range repos {
		items[i] = accessibleRepoResponse{
			FullName:      r.FullName,
			Owner:         r.Owner.Login,
			RepoName:      r.Name,
			DefaultBranch: r.DefaultBranch,
			Private:       r.Private,
		}
	}
	ok(res, items)
}

func (p *forgejoPlugin) listRepositories(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID

	result, err := p.db.Query(`
		SELECT id, project_id, owner, repo_name, full_name, instance_url, default_branch, webhook_id, created_at, updated_at
		FROM forgejo_repositories WHERE project_id = $1 ORDER BY created_at ASC
	`, projectID)
	if err != nil {
		apiError(res, 500, "INTERNAL_ERROR", err.Error())
		return
	}

	items := make([]repositoryResponse, 0, len(result.Rows))
	for _, row := range result.Rows {
		sc := newRowScanner(result.Columns, row)
		fullName := sc.str("full_name")
		instanceURL := sc.str("instance_url")
		items = append(items, repositoryResponse{
			ID:            sc.str("id"),
			ProjectID:     sc.str("project_id"),
			Owner:         sc.str("owner"),
			RepoName:      sc.str("repo_name"),
			FullName:      fullName,
			InstanceURL:   instanceURL,
			DefaultBranch: sc.str("default_branch"),
			CloneURL:      fmt.Sprintf("https://%s/%s.git", instanceURL, fullName),
			WebhookActive: sc.int64Val("webhook_id") > 0,
			CreatedAt:     sc.str("created_at"),
			UpdatedAt:     sc.str("updated_at"),
		})
	}
	ok(res, items)
}

func (p *forgejoPlugin) linkRepository(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID

	type bodyT struct {
		Owner    string `json:"owner"`
		RepoName string `json:"repo_name"`
	}
	b, err := plugin.JSONBody[bodyT](req)
	if err != nil || b.Owner == "" || b.RepoName == "" {
		apiError(res, 400, "BAD_REQUEST", "owner and repo_name are required")
		return
	}

	webhookURL, err := webhookURLFromPublicURL(p.cfg, projectID)
	if err != nil {
		apiError(res, 422, "FORGEJO_WEBHOOK_URL_REQUIRED", "PUBLIC_URL is not configured")
		return
	}

	fjc, err := p.newClientForProject(projectID)
	if err != nil {
		writeAppError(res, err)
		return
	}

	fjRepo, err := fjc.getRepository(context.Background(), b.Owner, b.RepoName)
	if err != nil {
		var apiErr *fjAPIError
		if errors.As(err, &apiErr) && (apiErr.StatusCode == 403 || apiErr.StatusCode == 404) {
			apiError(res, 422, "FORGEJO_REPO_NOT_ACCESSIBLE", "Repository not accessible with the provided token")
			return
		}
		apiError(res, 502, "INTERNAL_ERROR", fmt.Sprintf("failed to get repository: %s", err))
		return
	}

	existResult, _ := p.db.Query(
		`SELECT id FROM forgejo_repositories WHERE project_id = $1 AND full_name = $2`,
		projectID, fjRepo.FullName,
	)
	if existResult != nil && len(existResult.Rows) > 0 {
		apiError(res, 409, "FORGEJO_REPO_ALREADY_LINKED", "Repository is already linked to this project")
		return
	}

	integResult, iErr := p.db.Query(
		`SELECT id, oauth_instance_url FROM forgejo_integrations WHERE project_id = $1`, projectID,
	)
	if iErr != nil || len(integResult.Rows) == 0 {
		apiError(res, 404, "FORGEJO_INTEGRATION_NOT_FOUND", "Forgejo integration not found")
		return
	}
	integSc := newRowScanner(integResult.Columns, integResult.Rows[0])
	integrationID := integSc.str("id")
	instanceURL := integSc.str("oauth_instance_url")

	secretBytes := make([]byte, 32)
	if _, randErr := rand.Read(secretBytes); randErr != nil {
		apiError(res, 500, "INTERNAL_ERROR", "failed to generate webhook secret")
		return
	}
	webhookSecret := hex.EncodeToString(secretBytes)

	webhookID, err := fjc.createWebhook(context.Background(), fjRepo.Owner.Login, fjRepo.Name, webhookURL, webhookSecret,
		[]string{"push", "pull_request", "issue", "release", "check_run"})
	if err != nil {
		apiError(res, 502, "FORGEJO_WEBHOOK_CREATION_FAILED", fmt.Sprintf("failed to create webhook: %s", err))
		return
	}

	encSecret, err := p.encrypt(webhookSecret)
	if err != nil {
		_ = fjc.deleteWebhook(context.Background(), fjRepo.Owner.Login, fjRepo.Name, webhookID)
		apiError(res, 500, "INTERNAL_ERROR", "failed to encrypt webhook secret")
		return
	}

	now := nowStr()
	inserted, dbErr := p.db.Query(`
		INSERT INTO forgejo_repositories
			(project_id, integration_id, owner, repo_name, full_name, instance_url,
			 webhook_id, webhook_secret_enc, default_branch, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
		RETURNING id
	`, projectID, integrationID, fjRepo.Owner.Login, fjRepo.Name, fjRepo.FullName,
		instanceURL, webhookID, encSecret, fjRepo.DefaultBranch, now)
	if dbErr != nil || len(inserted.Rows) == 0 {
		_ = fjc.deleteWebhook(context.Background(), fjRepo.Owner.Login, fjRepo.Name, webhookID)
		if dbErr != nil {
			apiError(res, 500, "INTERNAL_ERROR", dbErr.Error())
		} else {
			apiError(res, 500, "INTERNAL_ERROR", "insert returned no rows")
		}
		return
	}
	repoID := newRowScanner(inserted.Columns, inserted.Rows[0]).str("id")

	created(res, repositoryResponse{
		ID:            repoID,
		ProjectID:     projectID,
		Owner:         fjRepo.Owner.Login,
		RepoName:      fjRepo.Name,
		FullName:      fjRepo.FullName,
		InstanceURL:   instanceURL,
		DefaultBranch: fjRepo.DefaultBranch,
		CloneURL:      fmt.Sprintf("https://%s/%s.git", instanceURL, fjRepo.FullName),
		WebhookActive: webhookID > 0,
		CreatedAt:     now,
		UpdatedAt:     now,
	})
}

func (p *forgejoPlugin) unlinkRepository(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID
	repoID := req.PathParam("repoId")

	result, err := p.db.Query(
		`SELECT owner, repo_name, webhook_id FROM forgejo_repositories WHERE id = $1 AND project_id = $2`,
		repoID, projectID,
	)
	if err != nil {
		apiError(res, 500, "INTERNAL_ERROR", err.Error())
		return
	}
	if len(result.Rows) == 0 {
		apiError(res, 404, "FORGEJO_REPOSITORY_NOT_FOUND", "Repository not found")
		return
	}
	sc := newRowScanner(result.Columns, result.Rows[0])
	owner := sc.str("owner")
	repoName := sc.str("repo_name")
	webhookID := sc.int64Val("webhook_id")

	if webhookID > 0 {
		if fjc, tErr := p.newClientForProject(projectID); tErr == nil {
			_ = fjc.deleteWebhook(context.Background(), owner, repoName, webhookID)
		}
	}

	_, err = p.db.Exec(`DELETE FROM forgejo_repositories WHERE id = $1`, repoID)
	if err != nil {
		apiError(res, 500, "INTERNAL_ERROR", err.Error())
		return
	}
	noContent(res)
}

func (p *forgejoPlugin) getRepoCloneInfo(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID
	repoID := req.PathParam("repoId")
	if repoID == "" {
		apiError(res, 400, "BAD_REQUEST", "repoId path parameter is required")
		return
	}

	result, err := p.db.Query(
		`SELECT id, full_name, owner, repo_name, instance_url FROM forgejo_repositories WHERE project_id = $1 AND id = $2`,
		projectID, repoID,
	)
	if err != nil {
		apiError(res, 500, "INTERNAL_ERROR", err.Error())
		return
	}
	if len(result.Rows) == 0 {
		apiError(res, 404, "FORGEJO_REPOSITORY_NOT_FOUND", "repository not found")
		return
	}

	it, err := p.decryptTokenWithInstance(projectID)
	if err != nil {
		writeAppError(res, err)
		return
	}

	sc := newRowScanner(result.Columns, result.Rows[0])
	fullName := sc.str("full_name")
	instanceURL := sc.str("instance_url")
	ok(res, repoCloneInfo{
		ID:        sc.str("id"),
		FullName:  fullName,
		Owner:     sc.str("owner"),
		RepoName:  sc.str("repo_name"),
		CloneURL:  fmt.Sprintf("https://%s/%s.git", instanceURL, fullName),
		Token:     it.token,
		ExpiresAt: 0,
	})
}

type appError struct {
	code   string
	status int
	msg    string
}

func (e *appError) Error() string { return e.msg }

func writeAppError(res *plugin.Response, err error) {
	var ae *appError
	if errors.As(err, &ae) {
		apiError(res, ae.status, ae.code, ae.msg)
		return
	}
	apiError(res, 500, "INTERNAL_ERROR", err.Error())
}
