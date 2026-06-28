package main

import (
	"context"
	"errors"
	"fmt"

	plugin "github.com/Paca-AI/plugin-sdk-go"
)

type pullRequestResponse struct {
	ID         string  `json:"id"`
	ProjectID  string  `json:"project_id"`
	RepoID     string  `json:"repo_id"`
	PRNumber   int     `json:"pr_number"`
	ForgejoPRID int64  `json:"forgejo_pr_id"`
	Title      string  `json:"title"`
	State      string  `json:"state"`
	HTMLURL    string  `json:"html_url"`
	HeadBranch string  `json:"head_branch"`
	BaseBranch string  `json:"base_branch"`
	Author     string  `json:"author"`
	MergedAt   *string `json:"merged_at"`
	CreatedAt  string  `json:"created_at"`
	UpdatedAt  string  `json:"updated_at"`
}

func (p *forgejoPlugin) listTaskPRs(req *plugin.Request, res *plugin.Response) {
	taskID := req.PathParam("taskId")

	result, err := p.db.Query(`
		SELECT pr.id, pr.project_id, pr.repo_id, pr.pr_number, pr.forgejo_pr_id,
		       pr.title, pr.state, pr.html_url, pr.head_branch, pr.base_branch,
		       pr.author, pr.merged_at, pr.created_at, pr.updated_at
		FROM forgejo_pull_requests pr
		JOIN forgejo_task_pr_links l ON l.pull_request_id = pr.id
		WHERE l.task_id = $1
		ORDER BY l.created_at ASC
	`, taskID)
	if err != nil {
		apiError(res, 500, "INTERNAL_ERROR", err.Error())
		return
	}

	items := make([]pullRequestResponse, 0, len(result.Rows))
	for _, row := range result.Rows {
		sc := newRowScanner(result.Columns, row)
		pr := pullRequestResponse{
			ID:          sc.str("id"),
			ProjectID:   sc.str("project_id"),
			RepoID:      sc.str("repo_id"),
			PRNumber:    sc.intVal("pr_number"),
			ForgejoPRID: sc.int64Val("forgejo_pr_id"),
			Title:       sc.str("title"),
			State:       sc.str("state"),
			HTMLURL:     sc.str("html_url"),
			HeadBranch:  sc.str("head_branch"),
			BaseBranch:  sc.str("base_branch"),
			Author:      sc.str("author"),
			MergedAt:    sc.strPtr("merged_at"),
			CreatedAt:   sc.str("created_at"),
			UpdatedAt:   sc.str("updated_at"),
		}
		items = append(items, pr)
	}
	ok(res, items)
}

func (p *forgejoPlugin) linkPRToTask(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID
	taskID := req.PathParam("taskId")

	type bodyT struct {
		RepoID   string `json:"repo_id"`
		PRNumber int    `json:"pr_number"`
	}
	b, err := plugin.JSONBody[bodyT](req)
	if err != nil || b.RepoID == "" || b.PRNumber == 0 {
		apiError(res, 400, "BAD_REQUEST", "repo_id and pr_number are required")
		return
	}

	fjc, err := p.newClientForProject(projectID)
	if err != nil {
		writeAppError(res, err)
		return
	}

	repoResult, rErr := p.db.Query(
		`SELECT owner, repo_name FROM forgejo_repositories WHERE id = $1 AND project_id = $2`,
		b.RepoID, projectID,
	)
	if rErr != nil {
		apiError(res, 500, "INTERNAL_ERROR", rErr.Error())
		return
	}
	if len(repoResult.Rows) == 0 {
		apiError(res, 404, "FORGEJO_REPOSITORY_NOT_FOUND", "Repository not found")
		return
	}
	rSc := newRowScanner(repoResult.Columns, repoResult.Rows[0])
	owner := rSc.str("owner")
	repoName := rSc.str("repo_name")

	fjPR, err := fjc.getPullRequest(context.Background(), owner, repoName, b.PRNumber)
	if err != nil {
		var apiErr *fjAPIError
		if errors.As(err, &apiErr) {
			switch apiErr.StatusCode {
			case 404:
				apiError(res, 404, "FORGEJO_PR_NOT_FOUND", fmt.Sprintf("PR #%d not found in %s/%s", b.PRNumber, owner, repoName))
				return
			case 401, 403:
				apiError(res, 403, "FORGEJO_TOKEN_INSUFFICIENT_PERMISSIONS", "Token does not have permission to read pull requests")
				return
			}
		}
		apiError(res, 502, "INTERNAL_ERROR", fmt.Sprintf("failed to fetch pull request: %s", err))
		return
	}

	state := fjPR.State
	if fjPR.Merged {
		state = "merged"
	}

	now := nowStr()

	var mergedAtStr *string
	if fjPR.MergedAt != nil {
		s := fjPR.MergedAt.UTC().Format("2006-01-02T15:04:05.999999999Z")
		mergedAtStr = &s
	}

	upserted, err := p.db.Query(`
		INSERT INTO forgejo_pull_requests
			(project_id, repo_id, pr_number, forgejo_pr_id, title, state, html_url,
			 head_branch, base_branch, author, merged_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
		ON CONFLICT (repo_id, pr_number) DO UPDATE SET
			title=$5, state=$6, html_url=$7, head_branch=$8, base_branch=$9,
			author=$10, merged_at=$11, updated_at=$13
		RETURNING id, created_at
	`, projectID, b.RepoID, b.PRNumber, fjPR.ID, fjPR.Title, state,
		fjPR.HTMLURL, fjPR.Head.Ref, fjPR.Base.Ref, fjPR.User.Login, mergedAtStr, now, now)
	if err != nil || len(upserted.Rows) == 0 {
		if err != nil {
			apiError(res, 500, "INTERNAL_ERROR", err.Error())
		} else {
			apiError(res, 500, "INTERNAL_ERROR", "upsert returned no rows")
		}
		return
	}
	prSc := newRowScanner(upserted.Columns, upserted.Rows[0])
	prID := prSc.str("id")
	prCreatedAt := prSc.str("created_at")

	rowsAffected, lErr := p.db.Exec(`
		INSERT INTO forgejo_task_pr_links (task_id, pull_request_id, created_at)
		VALUES ($1,$2,$3)
		ON CONFLICT (task_id, pull_request_id) DO NOTHING
	`, taskID, prID, now)
	if lErr != nil {
		apiError(res, 500, "INTERNAL_ERROR", lErr.Error())
		return
	}
	if rowsAffected == 0 {
		apiError(res, 409, "FORGEJO_PR_ALREADY_LINKED", "Pull request is already linked to this task")
		return
	}

	plugin.EmitEvent("forgejo.pr_linked", map[string]any{
		"project_id": projectID,
		"task_id":    taskID,
		"repo_id":    b.RepoID,
		"pr_number":  b.PRNumber,
	})

	ok(res, pullRequestResponse{
		ID:          prID,
		ProjectID:   projectID,
		RepoID:      b.RepoID,
		PRNumber:    b.PRNumber,
		ForgejoPRID: fjPR.ID,
		Title:       fjPR.Title,
		State:       state,
		HTMLURL:     fjPR.HTMLURL,
		HeadBranch:  fjPR.Head.Ref,
		BaseBranch:  fjPR.Base.Ref,
		Author:      fjPR.User.Login,
		MergedAt:    mergedAtStr,
		CreatedAt:   prCreatedAt,
		UpdatedAt:   now,
	})
}

func (p *forgejoPlugin) createPullRequest(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID
	taskID := req.PathParam("taskId")

	type bodyT struct {
		RepoID     string `json:"repo_id"`
		Title      string `json:"title"`
		HeadBranch string `json:"head_branch"`
		BaseBranch string `json:"base_branch"`
		Body       string `json:"body"`
	}
	b, err := plugin.JSONBody[bodyT](req)
	if err != nil || b.RepoID == "" || b.Title == "" || b.HeadBranch == "" || b.BaseBranch == "" {
		apiError(res, 400, "BAD_REQUEST", "repo_id, title, head_branch, and base_branch are required")
		return
	}

	fjc, err := p.newClientForProject(projectID)
	if err != nil {
		writeAppError(res, err)
		return
	}

	repoResult, rErr := p.db.Query(
		`SELECT owner, repo_name FROM forgejo_repositories WHERE id = $1 AND project_id = $2`,
		b.RepoID, projectID,
	)
	if rErr != nil {
		apiError(res, 500, "INTERNAL_ERROR", rErr.Error())
		return
	}
	if len(repoResult.Rows) == 0 {
		apiError(res, 404, "FORGEJO_REPOSITORY_NOT_FOUND", "Repository not found")
		return
	}
	rSc := newRowScanner(repoResult.Columns, repoResult.Rows[0])
	owner := rSc.str("owner")
	repoName := rSc.str("repo_name")

	fjPR, err := fjc.createPullRequest(context.Background(), owner, repoName, b.Title, b.HeadBranch, b.BaseBranch, b.Body)
	if err != nil {
		var apiErr *fjAPIError
		if errors.As(err, &apiErr) {
			switch apiErr.StatusCode {
			case 401, 403:
				apiError(res, 403, "FORGEJO_TOKEN_INSUFFICIENT_PERMISSIONS", "Token does not have permission to create pull requests")
				return
			case 422:
				apiError(res, 422, "FORGEJO_PR_VALIDATION_ERROR", fmt.Sprintf("Forgejo validation error: %s", apiErr.Message))
				return
			}
		}
		apiError(res, 502, "INTERNAL_ERROR", fmt.Sprintf("failed to create pull request: %s", err))
		return
	}

	state := fjPR.State
	if fjPR.Merged {
		state = "merged"
	}

	now := nowStr()

	var mergedAtStr *string
	if fjPR.MergedAt != nil {
		s := fjPR.MergedAt.UTC().Format("2006-01-02T15:04:05.999999999Z")
		mergedAtStr = &s
	}

	upserted, err := p.db.Query(`
		INSERT INTO forgejo_pull_requests
			(project_id, repo_id, pr_number, forgejo_pr_id, title, state, html_url,
			 head_branch, base_branch, author, merged_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
		ON CONFLICT (repo_id, pr_number) DO UPDATE SET
			title=$5, state=$6, html_url=$7, head_branch=$8, base_branch=$9,
			author=$10, merged_at=$11, updated_at=$12
		RETURNING id
	`, projectID, b.RepoID, fjPR.Number, fjPR.ID, fjPR.Title, state,
		fjPR.HTMLURL, fjPR.Head.Ref, fjPR.Base.Ref, fjPR.User.Login, mergedAtStr, now)
	if err != nil || len(upserted.Rows) == 0 {
		if err != nil {
			apiError(res, 500, "INTERNAL_ERROR", err.Error())
		} else {
			apiError(res, 500, "INTERNAL_ERROR", "upsert returned no rows")
		}
		return
	}
	prID := newRowScanner(upserted.Columns, upserted.Rows[0]).str("id")

	_, lErr := p.db.Exec(`
		INSERT INTO forgejo_task_pr_links (task_id, pull_request_id, created_at)
		VALUES ($1,$2,$3)
		ON CONFLICT (task_id, pull_request_id) DO NOTHING
	`, taskID, prID, now)
	if lErr != nil {
		p.log.Error("failed to link PR to task: " + lErr.Error())
	}

	plugin.EmitEvent("forgejo.pr_created", map[string]any{
		"project_id": projectID,
		"task_id":    taskID,
		"repo_id":    b.RepoID,
		"pr_number":  fjPR.Number,
		"pr_url":     fjPR.HTMLURL,
	})

	created(res, pullRequestResponse{
		ID:          prID,
		ProjectID:   projectID,
		RepoID:      b.RepoID,
		PRNumber:    fjPR.Number,
		ForgejoPRID: fjPR.ID,
		Title:       fjPR.Title,
		State:       state,
		HTMLURL:     fjPR.HTMLURL,
		HeadBranch:  fjPR.Head.Ref,
		BaseBranch:  fjPR.Base.Ref,
		Author:      fjPR.User.Login,
		MergedAt:    mergedAtStr,
		CreatedAt:   now,
		UpdatedAt:   now,
	})
}

func (p *forgejoPlugin) unlinkPRFromTask(req *plugin.Request, res *plugin.Response) {
	taskID := req.PathParam("taskId")
	prID := req.PathParam("prId")

	rowsAffected, err := p.db.Exec(
		`DELETE FROM forgejo_task_pr_links WHERE task_id = $1 AND pull_request_id = $2`,
		taskID, prID,
	)
	if err != nil {
		apiError(res, 500, "INTERNAL_ERROR", err.Error())
		return
	}
	if rowsAffected == 0 {
		apiError(res, 404, "FORGEJO_PR_LINK_NOT_FOUND", "Pull request link not found")
		return
	}
	noContent(res)
}
