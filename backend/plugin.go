package main

import (
	"encoding/json"
	"time"

	plugin "github.com/Paca-AI/plugin-sdk-go"
)

func nowStr() string {
	return time.Now().UTC().Format(time.RFC3339Nano)
}

type forgejoPlugin struct {
	db  *plugin.DB
	log *plugin.Logger
	cfg *plugin.Config
}

func (p *forgejoPlugin) Init(ctx *plugin.Context) error {
	p.db = ctx.DB()
	p.log = ctx.Log()
	p.cfg = ctx.Config()

	ctx.On("task.deleted", p.handleTaskDeleted)
	ctx.On("project.deleted", p.handleProjectDeleted)

	ctx.Route("GET", "/integration", p.getIntegration)
	ctx.Route("POST", "/integration/token", p.setToken)
	ctx.Route("DELETE", "/integration/token", p.deleteToken)
	ctx.Route("GET", "/integration/accessible-repos", p.listAccessibleRepos)

	ctx.Route("GET", "/repositories", p.listRepositories)
	ctx.Route("POST", "/repositories", p.linkRepository)
	ctx.Route("DELETE", "/repositories/:repoId", p.unlinkRepository)
	ctx.Route("GET", "/repositories/:repoId/clone-info", p.getRepoCloneInfo)

	ctx.Route("GET", "/tasks/:taskId/pull-requests", p.listTaskPRs)
	ctx.Route("POST", "/tasks/:taskId/pull-requests", p.createPullRequest)
	ctx.Route("POST", "/tasks/:taskId/pull-requests/link", p.linkPRToTask)
	ctx.Route("DELETE", "/tasks/:taskId/pull-requests/:prId", p.unlinkPRFromTask)

	ctx.Route("GET", "/tasks/:taskId/branches", p.listTaskBranches)
	ctx.Route("POST", "/tasks/:taskId/branches", p.createBranch)

	ctx.Route("POST", "/webhook", p.receiveWebhook)

	return nil
}

func (p *forgejoPlugin) Shutdown() {}

type envelope struct {
	Success bool `json:"success"`
	Data    any  `json:"data"`
}

func ok(res *plugin.Response, data any) {
	res.JSON(200, envelope{Success: true, Data: data})
}

func created(res *plugin.Response, data any) {
	res.JSON(201, envelope{Success: true, Data: data})
}

func noContent(res *plugin.Response) {
	res.NoContent()
}

func apiError(res *plugin.Response, code int, errCode, message string) {
	res.JSON(code, map[string]any{
		"success":    false,
		"error":      message,
		"error_code": errCode,
	})
}

func (p *forgejoPlugin) handleTaskDeleted(evt *plugin.Event) {
	var payload struct {
		TaskID string `json:"task_id"`
	}
	if err := json.Unmarshal(evt.Payload, &payload); err != nil || payload.TaskID == "" {
		return
	}
	_, _ = p.db.Exec(`DELETE FROM forgejo_task_branches WHERE task_id = $1`, payload.TaskID)
	_, _ = p.db.Exec(`DELETE FROM forgejo_task_pr_links WHERE task_id = $1`, payload.TaskID)
}

func (p *forgejoPlugin) handleProjectDeleted(evt *plugin.Event) {
	var payload struct {
		ProjectID string `json:"project_id"`
	}
	if err := json.Unmarshal(evt.Payload, &payload); err != nil || payload.ProjectID == "" {
		return
	}
	_, _ = p.db.Exec(`DELETE FROM forgejo_integrations WHERE project_id = $1`, payload.ProjectID)
}
