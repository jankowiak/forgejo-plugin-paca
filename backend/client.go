package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	plugin "github.com/Paca-AI/plugin-sdk-go"
)

// fjRepository is a minimal Forgejo repository representation.
type fjRepository struct {
	ID       int64  `json:"id"`
	FullName string `json:"full_name"`
	Name     string `json:"name"`
	Owner    struct {
		Login string `json:"login"`
	} `json:"owner"`
	DefaultBranch string `json:"default_branch"`
	Private       bool   `json:"private"`
}

// fjPullRequest is a minimal Forgejo pull request representation.
type fjPullRequest struct {
	ID      int64  `json:"id"`
	Number  int    `json:"number"`
	Title   string `json:"title"`
	State   string `json:"state"`
	HTMLURL string `json:"html_url"`
	Head    struct {
		Ref string `json:"ref"`
	} `json:"head"`
	Base struct {
		Ref string `json:"ref"`
	} `json:"base"`
	User struct {
		Login string `json:"login"`
	} `json:"user"`
	Merged   bool       `json:"merged"`
	MergedAt *time.Time `json:"merged_at"`
}

type fjAPIError struct {
	StatusCode int
	Message    string
	Details    string
}

func (e *fjAPIError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("forgejo: API error %d: %s (%s)", e.StatusCode, e.Message, e.Details)
	}
	return fmt.Sprintf("forgejo: API error %d: %s", e.StatusCode, e.Message)
}

type fjClient struct {
	instanceURL string
	token       string
}

func newFJClient(instanceURL, token string) *fjClient {
	return &fjClient{
		instanceURL: strings.TrimRight(instanceURL, "/"),
		token:       token,
	}
}

func (c *fjClient) apiURL(path string) string {
	return fmt.Sprintf("%s/api/v1%s", c.instanceURL, path)
}

func (c *fjClient) headers() map[string]string {
	return map[string]string{
		"Authorization": "token " + c.token,
		"Accept":        "application/json",
	}
}

func (c *fjClient) get(_ context.Context, rawURL string, out any) error {
	resp, err := plugin.Fetch("GET", rawURL, c.headers(), "")
	if err != nil {
		return fmt.Errorf("fjclient: execute request: %w", err)
	}
	if resp.Status >= 400 {
		return fjParseAPIError(resp.Status, resp.Body)
	}
	if out != nil {
		if err := json.Unmarshal([]byte(resp.Body), out); err != nil {
			return fmt.Errorf("fjclient: decode response: %w", err)
		}
	}
	return nil
}

func (c *fjClient) post(_ context.Context, rawURL string, body, out any) error {
	bodyJSON, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("fjclient: encode body: %w", err)
	}
	hdrs := c.headers()
	hdrs["Content-Type"] = "application/json"
	resp, err := plugin.Fetch("POST", rawURL, hdrs, string(bodyJSON))
	if err != nil {
		return fmt.Errorf("fjclient: execute request: %w", err)
	}
	if resp.Status >= 400 {
		return fjParseAPIError(resp.Status, resp.Body)
	}
	if out != nil {
		if err := json.Unmarshal([]byte(resp.Body), out); err != nil {
			return fmt.Errorf("fjclient: decode response: %w", err)
		}
	}
	return nil
}

func (c *fjClient) doDelete(_ context.Context, rawURL string) error {
	resp, err := plugin.Fetch("DELETE", rawURL, c.headers(), "")
	if err != nil {
		return fmt.Errorf("fjclient: execute request: %w", err)
	}
	if resp.Status == 404 || resp.Status == 204 {
		return nil
	}
	if resp.Status >= 400 {
		return fjParseAPIError(resp.Status, resp.Body)
	}
	return nil
}

func fjParseAPIError(statusCode int, body string) error {
	var errBody struct {
		Message string `json:"message"`
		Message2 string `json:"message2"`
	}
	_ = json.Unmarshal([]byte(body), &errBody)
	msg := errBody.Message
	if msg == "" {
		msg = errBody.Message2
	}
	if msg == "" {
		msg = fmt.Sprintf("HTTP %d", statusCode)
	}
	return &fjAPIError{
		StatusCode: statusCode,
		Message:    msg,
	}
}

func (c *fjClient) validateToken(ctx context.Context) error {
	var user struct {
		Login string `json:"login"`
	}
	return c.get(ctx, c.apiURL("/user"), &user)
}

func (c *fjClient) listRepositories(ctx context.Context) ([]fjRepository, error) {
	var all []fjRepository
	for page := 1; ; page++ {
		url := fmt.Sprintf("%s/user/repos?limit=50&page=%d", c.apiURL(""), page)
		var batch []fjRepository
		if err := c.get(ctx, url, &batch); err != nil {
			return nil, err
		}
		all = append(all, batch...)
		if len(batch) < 50 {
			break
		}
	}
	return all, nil
}

func (c *fjClient) getRepository(ctx context.Context, owner, repo string) (*fjRepository, error) {
	url := c.apiURL(fmt.Sprintf("/repos/%s/%s", owner, repo))
	var r fjRepository
	if err := c.get(ctx, url, &r); err != nil {
		return nil, err
	}
	return &r, nil
}

func (c *fjClient) createWebhook(ctx context.Context, owner, repo, webhookURL, secret string, events []string) (int64, error) {
	url := c.apiURL(fmt.Sprintf("/repos/%s/%s/hooks", owner, repo))
	body := map[string]any{
		"type":   "forgejo",
		"active": true,
		"events": events,
		"config": map[string]string{
			"url":          webhookURL,
			"content_type": "json",
			"secret":       secret,
		},
	}
	var resp struct {
		ID int64 `json:"id"`
	}
	if err := c.post(ctx, url, body, &resp); err != nil {
		return 0, err
	}
	return resp.ID, nil
}

func (c *fjClient) deleteWebhook(ctx context.Context, owner, repo string, hookID int64) error {
	url := c.apiURL(fmt.Sprintf("/repos/%s/%s/hooks/%d", owner, repo, hookID))
	return c.doDelete(ctx, url)
}

func (c *fjClient) getPullRequest(ctx context.Context, owner, repo string, prNumber int) (*fjPullRequest, error) {
	url := c.apiURL(fmt.Sprintf("/repos/%s/%s/pulls/%d", owner, repo, prNumber))
	var pr fjPullRequest
	if err := c.get(ctx, url, &pr); err != nil {
		return nil, err
	}
	return &pr, nil
}

func (c *fjClient) createPullRequest(ctx context.Context, owner, repo, title, head, base, body string) (*fjPullRequest, error) {
	url := c.apiURL(fmt.Sprintf("/repos/%s/%s/pulls", owner, repo))
	reqBody := map[string]string{
		"title": title,
		"head":  head,
		"base":  base,
	}
	if body != "" {
		reqBody["body"] = body
	}
	var pr fjPullRequest
	if err := c.post(ctx, url, reqBody, &pr); err != nil {
		return nil, err
	}
	return &pr, nil
}

func (c *fjClient) createBranch(ctx context.Context, owner, repo, newBranch, sourceBranch string) error {
	refURL := c.apiURL(fmt.Sprintf("/repos/%s/%s/git/refs/heads/%s", owner, repo, sourceBranch))
	var refResp struct {
		Ref    string `json:"ref"`
		Object struct {
			SHA string `json:"sha"`
		} `json:"object"`
	}
	if err := c.get(ctx, refURL, &refResp); err != nil {
		return fmt.Errorf("resolve source branch %q: %w", sourceBranch, err)
	}

	createURL := c.apiURL(fmt.Sprintf("/repos/%s/%s/git/refs", owner, repo))
	return c.post(ctx, createURL, map[string]string{
		"ref": "refs/heads/" + newBranch,
		"sha": refResp.Object.SHA,
	}, nil)
}
