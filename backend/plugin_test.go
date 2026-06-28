package main

import (
	"encoding/json"
	"testing"

	plugin "github.com/Paca-AI/plugin-sdk-go"
	"github.com/Paca-AI/plugin-sdk-go/plugintest"
)

const (
	testProjectID = "project-1"
	testTaskID    = "task-1"
)

func setupPlugin(t *testing.T) *plugintest.Context {
	t.Helper()
	tc := plugintest.NewContext(t)

	tc.DB.SeedRows("tasks", []string{"id", "project_id", "deleted_at"}, [][]any{
		{testTaskID, testProjectID, nil},
	})

	tc.DB.SeedRows("forgejo_integrations",
		[]string{"id", "project_id", "provider", "access_token_enc", "oauth_instance_url", "created_at", "updated_at"},
		nil)
	tc.DB.SeedRows("forgejo_repositories",
		[]string{"id", "project_id", "integration_id", "owner", "repo_name", "full_name",
			"instance_url", "webhook_id", "webhook_secret_enc", "default_branch", "created_at", "updated_at"},
		nil)
	tc.DB.SeedRows("forgejo_pull_requests",
		[]string{"id", "project_id", "repo_id", "pr_number", "forgejo_pr_id", "title",
			"state", "html_url", "head_branch", "base_branch", "author", "merged_at", "created_at", "updated_at"},
		nil)
	tc.DB.SeedRows("forgejo_task_pr_links",
		[]string{"id", "task_id", "pull_request_id", "created_at"},
		nil)
	tc.DB.SeedRows("forgejo_task_branches",
		[]string{"id", "task_id", "repo_id", "branch_name", "created_at"},
		nil)

	var p forgejoPlugin
	if err := p.Init(tc.PluginContext()); err != nil {
		t.Fatal("Init failed:", err)
	}
	return tc
}

func callerReq() plugintest.Request {
	return plugintest.Request{
		Caller: plugin.CallerIdentity{
			ProjectID:  testProjectID,
			CallerID:   "member-1",
			CallerRole: "PROJECT_MEMBER",
		},
		PathParams: map[string]string{},
	}
}

func TestGetIntegration_NotConnected(t *testing.T) {
	tc := setupPlugin(t)
	res := tc.Call("GET", "/integration", callerReq())

	if res.StatusCode != 200 {
		t.Fatalf("expected 200, got %d: %s", res.StatusCode, res.BodyString())
	}
	var env struct {
		Success bool                `json:"success"`
		Data    integrationResponse `json:"data"`
	}
	if err := json.Unmarshal(res.Body, &env); err != nil {
		t.Fatal(err)
	}
	if !env.Success {
		t.Fatal("expected success=true")
	}
	if env.Data.Connected {
		t.Fatal("expected Connected=false when no token is set")
	}
	if env.Data.ProjectID != testProjectID {
		t.Fatalf("expected project_id=%s, got %s", testProjectID, env.Data.ProjectID)
	}
}
