package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"regexp"
	"strconv"
	"strings"
	"time"

	plugin "github.com/Paca-AI/plugin-sdk-go"
)

var branchTaskRefRe = regexp.MustCompile(`(?i)\b([A-Z][A-Z0-9]{1,19})-(\d{1,6})\b`)

func (p *forgejoPlugin) receiveWebhook(req *plugin.Request, res *plugin.Response) {
	event := req.Headers["X-Forgejo-Event"]
	if event == "" {
		event = req.Headers["X-Gitea-Event"]
	}
	signature := req.Headers["X-Hub-Signature-256"]

	body := req.Body
	if len(body) == 0 {
		res.NoContent()
		return
	}

	repoFullName := extractRepoFullName(body)
	if repoFullName == "" {
		res.NoContent()
		return
	}

	if err := p.handleWebhookEvent(repoFullName, event, signature, body); err != nil {
		p.log.Error("forgejo: webhook handler error: " + err.Error())
	}
	res.NoContent()
}

func (p *forgejoPlugin) handleWebhookEvent(repoFullName, event, signature string, payload []byte) error {
	p.log.Info("forgejo: webhook received, repo=" + repoFullName + ", event=" + event)

	result, err := p.db.Query(`
		SELECT id, project_id, integration_id, owner, repo_name, full_name, default_branch, webhook_secret_enc
		FROM forgejo_repositories WHERE full_name = $1
	`, repoFullName)
	if err != nil {
		p.log.Error("forgejo: failed to query repository: " + err.Error() + ", repo=" + repoFullName)
		return err
	}
	if len(result.Rows) == 0 {
		p.log.Info("forgejo: repository not found, repo=" + repoFullName)
		return nil
	}
	sc := newRowScanner(result.Columns, result.Rows[0])
	repoID := sc.str("id")
	projectID := sc.str("project_id")
	webhookSecretEnc := sc.str("webhook_secret_enc")

	if webhookSecretEnc != "" {
		secret, dErr := p.decrypt(webhookSecretEnc)
		if dErr != nil {
			p.log.Error("forgejo: failed to decrypt webhook secret: " + dErr.Error() + ", repo=" + repoFullName)
			return dErr
		}
		if !verifyHMAC(payload, secret, signature) {
			p.log.Info("forgejo: invalid webhook signature, repo=" + repoFullName)
			return nil
		}
	}

	switch event {
	case "pull_request":
		p.log.Info("forgejo: handling pull_request event, repo=" + repoFullName)
		return p.handlePREvent(repoID, projectID, payload)
	case "push":
		return p.handlePushEvent(repoID, projectID, payload)
	default:
		p.log.Info("forgejo: unhandled event type, event=" + event)
	}
	return nil
}

func (p *forgejoPlugin) handlePREvent(repoID, projectID string, payload []byte) error {
	var event struct {
		Action      string       `json:"action"`
		PullRequest fjPullRequest `json:"pull_request"`
	}
	if err := json.Unmarshal(payload, &event); err != nil {
		p.log.Error("forgejo: failed to parse pull_request event: " + err.Error())
		return err
	}
	fj := &event.PullRequest

	p.log.Info("forgejo: processing pull_request, action=" + event.Action +
		", pr_number=" + strconv.Itoa(fj.Number) + ", title=" + fj.Title + ", repo_id=" + repoID)

	state := fj.State
	if fj.Merged {
		state = "merged"
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)

	var mergedAtStr *string
	if fj.MergedAt != nil {
		s := fj.MergedAt.UTC().Format(time.RFC3339Nano)
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
		RETURNING id
	`, projectID, repoID, fj.Number, fj.ID, fj.Title, state,
		fj.HTMLURL, fj.Head.Ref, fj.Base.Ref, fj.User.Login, mergedAtStr, now, now)
	if err != nil {
		p.log.Error("forgejo: failed to upsert PR: " + err.Error() + ", repo_id=" + repoID + ", pr_number=" + strconv.Itoa(fj.Number))
		return err
	}
	var prID string
	if len(upserted.Rows) > 0 {
		prID = newRowScanner(upserted.Columns, upserted.Rows[0]).str("id")
	}

	p.log.Info("forgejo: PR saved successfully, pr_id=" + prID + ", pr_number=" + strconv.Itoa(fj.Number) + ", action=" + event.Action)

	if event.Action == "opened" || event.Action == "reopened" {
		brResult, _ := p.db.Query(
			`SELECT task_id FROM forgejo_task_branches WHERE repo_id = $1 AND branch_name = $2`,
			repoID, fj.Head.Ref,
		)
		if brResult != nil && len(brResult.Rows) > 0 {
			taskID := newRowScanner(brResult.Columns, brResult.Rows[0]).str("task_id")
			_, _ = p.db.Exec(`
				INSERT INTO forgejo_task_pr_links (task_id, pull_request_id, created_at)
				VALUES ($1,$2,$3)
				ON CONFLICT (task_id, pull_request_id) DO NOTHING
			`, taskID, prID, now)

			plugin.EmitEvent("forgejo.pr_linked", map[string]any{
				"project_id": projectID,
				"task_id":    taskID,
				"repo_id":    repoID,
				"pr_number":  fj.Number,
			})
			p.log.Info("forgejo: PR auto-linked to task, task_id=" + taskID + ", pr_number=" + strconv.Itoa(fj.Number))
		}
	}

	linkedResult, _ := p.db.Query(`SELECT task_id FROM forgejo_task_pr_links WHERE pull_request_id = $1`, prID)
	if linkedResult != nil {
		for _, row := range linkedResult.Rows {
			rsc := newRowScanner(linkedResult.Columns, row)
			plugin.EmitEvent("forgejo.pr_updated", map[string]any{
				"project_id": projectID,
				"task_id":    rsc.str("task_id"),
				"repo_id":    repoID,
				"pr_number":  fj.Number,
				"action":     event.Action,
			})
		}
	}
	return nil
}

func (p *forgejoPlugin) handlePushEvent(repoID, projectID string, payload []byte) error {
	var event struct {
		Ref     string `json:"ref"`
		Created bool   `json:"created"`
		Deleted bool   `json:"deleted"`
	}
	if err := json.Unmarshal(payload, &event); err != nil || !event.Created || event.Deleted {
		return nil
	}

	branchName := strings.TrimPrefix(event.Ref, "refs/heads/")
	if branchName == event.Ref {
		return nil
	}

	prefix, taskNumber, ok := extractBranchTaskRef(branchName)
	if !ok {
		return nil
	}

	taskResult, tErr := p.db.Query(`
		SELECT t.id FROM tasks t
		JOIN projects pr ON pr.id = t.project_id
		WHERE UPPER(pr.task_id_prefix) = UPPER($1) AND t.task_number = $2
		LIMIT 1
	`, prefix, taskNumber)
	if tErr != nil || len(taskResult.Rows) == 0 {
		return nil
	}
	taskID := newRowScanner(taskResult.Columns, taskResult.Rows[0]).str("id")

	now := time.Now().UTC().Format(time.RFC3339Nano)
	_, _ = p.db.Exec(`
		INSERT INTO forgejo_task_branches (task_id, repo_id, branch_name, created_at)
		VALUES ($1,$2,$3,$4)
		ON CONFLICT (task_id, repo_id, branch_name) DO NOTHING
	`, taskID, repoID, branchName, now)

	plugin.EmitEvent("forgejo.branch_linked", map[string]any{
		"project_id":  projectID,
		"task_id":     taskID,
		"repo_id":     repoID,
		"branch_name": branchName,
	})
	return nil
}

func verifyHMAC(payload []byte, secret, signatureHeader string) bool {
	const prefix = "sha256="
	if !strings.HasPrefix(signatureHeader, prefix) {
		return false
	}
	expected := signatureHeader[len(prefix):]
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	got := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(got), []byte(expected))
}

func extractRepoFullName(payload []byte) string {
	var v struct {
		Repository struct {
			FullName string `json:"full_name"`
		} `json:"repository"`
	}
	if err := json.Unmarshal(payload, &v); err != nil {
		return ""
	}
	return v.Repository.FullName
}

func extractBranchTaskRef(branchName string) (prefix string, taskNumber int64, ok bool) {
	m := branchTaskRefRe.FindStringSubmatch(branchName)
	if m == nil {
		return "", 0, false
	}
	n, err := strconv.ParseInt(m[2], 10, 64)
	if err != nil || n <= 0 {
		return "", 0, false
	}
	return strings.ToUpper(m[1]), n, true
}
