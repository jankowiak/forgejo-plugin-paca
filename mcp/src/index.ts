import {
	PluginAPIClient,
	type PluginMCPContext,
	type PluginMCPEntry,
	type Tool,
	errorResult,
	textResult,
} from "@paca-ai/plugin-sdk-mcp";

interface ForgejoIntegration {
	id: string;
	project_id: string;
	instance_url?: string;
	connected: boolean;
	provider?: string;
	created_at?: string;
	updated_at?: string;
}

interface LinkedRepository {
	id: string;
	project_id: string;
	owner: string;
	repo_name: string;
	full_name: string;
	instance_url: string;
	default_branch: string;
	clone_url: string;
	webhook_active: boolean;
	created_at: string;
	updated_at: string;
}

interface PullRequest {
	id: string;
	task_id?: string;
	repo_id?: string;
	pr_number: number;
	title: string;
	state: "open" | "closed" | "merged";
	html_url: string;
	head_branch: string;
	author: string | null;
	merged_at: string | null;
	created_at: string;
}

interface TaskBranch {
	id: string;
	task_id: string;
	repo_id: string;
	branch_name: string;
	created_at: string;
}

interface CreateBranchResult {
	branch_name: string;
}

interface CreatePullRequestResult {
	id: string;
	project_id: string;
	repo_id: string;
	pr_number: number;
	forgejo_pr_id: number;
	title: string;
	state: string;
	html_url: string;
	head_branch: string;
	base_branch: string;
	author: string;
	merged_at: string | null;
	created_at: string;
	updated_at: string;
}

function formatIntegration(integration: ForgejoIntegration): string {
	const lines = [
		"Forgejo Integration:",
		`Project ID: ${integration.project_id}`,
		`Connected: ${integration.connected ? "Yes" : "No"}`,
	];
	if (integration.instance_url) {
		lines.push(`Instance URL: ${integration.instance_url}`);
	}
	if (integration.provider) {
		lines.push(`Provider: ${integration.provider}`);
	}
	if (integration.created_at) {
		lines.push(`Created: ${integration.created_at}`);
	}
	if (integration.updated_at) {
		lines.push(`Updated: ${integration.updated_at}`);
	}
	return lines.join("\n");
}

function formatLinkedRepo(repo: LinkedRepository): string {
	return `Repository: ${repo.full_name}
ID: ${repo.id}
Owner: ${repo.owner}
Repo Name: ${repo.repo_name}
Instance: ${repo.instance_url}
Default Branch: ${repo.default_branch}
Clone URL: ${repo.clone_url}
Webhook Active: ${repo.webhook_active ? "Yes" : "No"}
Created: ${repo.created_at}`;
}

function formatPullRequest(pr: PullRequest): string {
	return `Pull Request: #${pr.pr_number} - ${pr.title}
ID: ${pr.id}
State: ${pr.state}
Author: ${pr.author ?? "Unknown"}
URL: ${pr.html_url}
Head Branch: ${pr.head_branch}
Created: ${pr.created_at}
Merged: ${pr.merged_at ? `Yes (${pr.merged_at})` : "No"}`;
}

function formatBranch(branch: TaskBranch): string {
	return `Branch: ${branch.branch_name}
ID: ${branch.id}
Task ID: ${branch.task_id}
Repo ID: ${branch.repo_id}
Created: ${branch.created_at}`;
}

function formatList<T>(items: T[], formatter: (item: T) => string): string {
	if (items.length === 0) return "(none)";
	return items.map(formatter).join("\n\n---\n\n");
}

const UUID_DESC =
	"The technical UUID of the %s (e.g., '550e8400-e29b-41d4-a716-446655440000').";

const projectIdProp = {
	type: "string",
	description:
		UUID_DESC.replace("%s", "project") +
		" Use list_projects to get the project ID. Do NOT use the project name.",
};

const taskIdProp = {
	type: "string",
	description:
		UUID_DESC.replace("%s", "task") + " Use list_tasks to get the task ID.",
};

const instanceUrlProp = {
	type: "string",
	description:
		"The URL of the Forgejo instance (e.g., 'https://forgejo.example.org'). Required for self-hosted Forgejo servers.",
};

const tools: Tool[] = [
	// ── Integration ──────────────────────────────────────────────────────────
	{
		name: "forgejo_get_integration",
		description: "Get Forgejo integration status for a project.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
			},
			required: ["projectId"],
		},
	},
	{
		name: "forgejo_set_token",
		description:
			"Set (or replace) the Forgejo personal access token for a project. The token must have at least the 'repo' scope.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
				instanceUrl: instanceUrlProp,
				token: {
					type: "string",
					description: "The Forgejo personal access token.",
				},
			},
			required: ["projectId", "instanceUrl", "token"],
		},
	},
	{
		name: "forgejo_delete_token",
		description: "Delete the Forgejo token for a project, removing Forgejo integration.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
			},
			required: ["projectId"],
		},
	},
	// ── Repositories ─────────────────────────────────────────────────────────
	{
		name: "forgejo_list_linked_repos",
		description: "List Forgejo repositories linked to a project.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
			},
			required: ["projectId"],
		},
	},
	{
		name: "forgejo_link_repository",
		description:
			"Link a Forgejo repository to a project. The repository must be accessible with the project's Forgejo token.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
				owner: {
					type: "string",
					description: "The repository owner (Forgejo username or org).",
				},
				repo_name: {
					type: "string",
					description: "The repository name (not including the owner).",
				},
			},
			required: ["projectId", "owner", "repo_name"],
		},
	},
	{
		name: "forgejo_unlink_repository",
		description: "Unlink a Forgejo repository from a project.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
				repoId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "linked repository") +
						" Use forgejo_list_linked_repos to get the repo ID.",
				},
			},
			required: ["projectId", "repoId"],
		},
	},
	// ── Pull Requests ─────────────────────────────────────────────────────────
	{
		name: "forgejo_list_task_prs",
		description: "List pull requests linked to a task.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
				taskId: taskIdProp,
			},
			required: ["projectId", "taskId"],
		},
	},
	{
		name: "forgejo_link_pr_to_task",
		description: "Link a Forgejo pull request to a task.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
				taskId: taskIdProp,
				repoId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "linked repository") +
						" Use forgejo_list_linked_repos to get the repo ID.",
				},
				pr_number: {
					type: "number",
					description: "The Forgejo pull request number (e.g., 42).",
				},
			},
			required: ["projectId", "taskId", "repoId", "pr_number"],
		},
	},
	{
		name: "forgejo_unlink_pr_from_task",
		description: "Unlink a pull request from a task.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
				taskId: taskIdProp,
				prId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "linked pull request") +
						" Use forgejo_list_task_prs to get the PR ID.",
				},
			},
			required: ["projectId", "taskId", "prId"],
		},
	},
	{
		name: "forgejo_create_pull_request",
		description:
			"Create a new pull request on Forgejo for a task. The pull request will be created on the linked repository and automatically linked to the task. Returns the PR URL.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
				taskId: taskIdProp,
				repoId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "linked repository") +
						" Use forgejo_list_linked_repos to get the repo ID.",
				},
				title: {
					type: "string",
					description:
						"The title for the pull request (e.g., 'feat: add user authentication').",
				},
				head_branch: {
					type: "string",
					description:
						"The name of the branch that contains the changes (the source branch, e.g., 'feat/PROJ-42-add-feature').",
				},
				base_branch: {
					type: "string",
					description:
						"The name of the branch to merge into (the target branch, e.g., 'main' or 'develop').",
				},
				body: {
					type: "string",
					description:
						"The description/body for the pull request in Markdown format (optional).",
				},
			},
			required: ["projectId", "taskId", "repoId", "title", "head_branch", "base_branch"],
		},
	},
	// ── Branches ─────────────────────────────────────────────────────────────
	{
		name: "forgejo_create_branch",
		description:
			"Create a new branch on Forgejo for a task and link it to the task.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
				taskId: taskIdProp,
				repoId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "linked repository") +
						" Use forgejo_list_linked_repos to get the repo ID.",
				},
				branch_name: {
					type: "string",
					description:
						"The name for the new branch (e.g., 'feat/PROJ-42-add-feature').",
				},
				source_branch: {
					type: "string",
					description:
						"The source branch to branch from. Defaults to the repository's default branch (optional).",
				},
			},
			required: ["projectId", "taskId", "repoId", "branch_name"],
		},
	},
	{
		name: "forgejo_list_task_branches",
		description: "List branches linked to a task.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: projectIdProp,
				taskId: taskIdProp,
			},
			required: ["projectId", "taskId"],
		},
	},
];

const entry: PluginMCPEntry = {
	tools,

	async handleToolCall(
		name: string,
		args: Record<string, unknown>,
		context: PluginMCPContext,
	) {
		const api = new PluginAPIClient(context);

		try {
			switch (name) {
				// ── Integration ────────────────────────────────────────────────
				case "forgejo_get_integration": {
					const { projectId } = args as { projectId: string };
					const integration = await api.pluginGet<ForgejoIntegration>(
						`projects/${projectId}/integration`,
					);
					return textResult(formatIntegration(integration));
				}

				case "forgejo_set_token": {
					const { projectId, instanceUrl, token } = args as {
						projectId: string;
						instanceUrl: string;
						token: string;
					};
					const integration = await api.pluginPost<ForgejoIntegration>(
						`projects/${projectId}/integration/token`,
						{ token, instance_url: instanceUrl },
					);
					return textResult(
						`Forgejo token set successfully:\n\n${formatIntegration(integration)}`,
					);
				}

				case "forgejo_delete_token": {
					const { projectId } = args as { projectId: string };
					await api.pluginDelete(`projects/${projectId}/integration/token`);
					return textResult("Forgejo token deleted successfully.");
				}

				// ── Repositories ───────────────────────────────────────────────
				case "forgejo_list_linked_repos": {
					const { projectId } = args as { projectId: string };
					const repos = await api.pluginGet<LinkedRepository[]>(
						`projects/${projectId}/repositories`,
					);
					return textResult(
						`Linked Forgejo Repositories:\n\n${formatList(repos, formatLinkedRepo)}`,
					);
				}

				case "forgejo_link_repository": {
					const { projectId, owner, repo_name } = args as {
						projectId: string;
						owner: string;
						repo_name: string;
					};
					const repo = await api.pluginPost<LinkedRepository>(
						`projects/${projectId}/repositories`,
						{ owner, repo_name },
					);
					return textResult(
						`Repository linked successfully:\n\n${formatLinkedRepo(repo)}`,
					);
				}

				case "forgejo_unlink_repository": {
					const { projectId, repoId } = args as {
						projectId: string;
						repoId: string;
					};
					await api.pluginDelete(
						`projects/${projectId}/repositories/${repoId}`,
					);
					return textResult(`Repository ${repoId} unlinked successfully.`);
				}

				// ── Pull Requests ──────────────────────────────────────────────
				case "forgejo_list_task_prs": {
					const { projectId, taskId } = args as {
						projectId: string;
						taskId: string;
					};
					const prs = await api.pluginGet<PullRequest[]>(
						`projects/${projectId}/tasks/${taskId}/pull-requests`,
					);
					return textResult(
						`Pull Requests:\n\n${formatList(prs, formatPullRequest)}`,
					);
				}

				case "forgejo_link_pr_to_task": {
					const { projectId, taskId, repoId, pr_number } = args as {
						projectId: string;
						taskId: string;
						repoId: string;
						pr_number: number;
					};
					const pr = await api.pluginPost<PullRequest>(
						`projects/${projectId}/tasks/${taskId}/pull-requests/link`,
						{ repo_id: repoId, pr_number },
					);
					return textResult(
						`Pull request linked successfully:\n\n${formatPullRequest(pr)}`,
					);
				}

				case "forgejo_unlink_pr_from_task": {
					const { projectId, taskId, prId } = args as {
						projectId: string;
						taskId: string;
						prId: string;
					};
					await api.pluginDelete(
						`projects/${projectId}/tasks/${taskId}/pull-requests/${prId}`,
					);
					return textResult(`Pull request ${prId} unlinked successfully.`);
				}

				case "forgejo_create_pull_request": {
					const { projectId, taskId, repoId, title, head_branch, base_branch, body } =
						args as {
							projectId: string;
							taskId: string;
							repoId: string;
							title: string;
							head_branch: string;
							base_branch: string;
							body?: string;
						};
					const pr = await api.pluginPost<CreatePullRequestResult>(
						`projects/${projectId}/tasks/${taskId}/pull-requests`,
						{ repo_id: repoId, title, head_branch, base_branch, body: body ?? "" },
					);
					return textResult(
						`Pull request created successfully:\n\n#${pr.pr_number} ${pr.title}\nState: ${pr.state}\nAuthor: ${pr.author}\nHead: ${pr.head_branch} → Base: ${pr.base_branch}\nURL: ${pr.html_url}`,
					);
				}

				// ── Branches ───────────────────────────────────────────────────
				case "forgejo_create_branch": {
					const { projectId, taskId, repoId, branch_name, source_branch } =
						args as {
							projectId: string;
							taskId: string;
							repoId: string;
							branch_name: string;
							source_branch?: string;
						};
					const result = await api.pluginPost<CreateBranchResult>(
						`projects/${projectId}/tasks/${taskId}/branches`,
						{ repo_id: repoId, branch_name, source_branch },
					);
					return textResult(
						`Branch created successfully:\n\nBranch: ${result.branch_name}`,
					);
				}

				case "forgejo_list_task_branches": {
					const { projectId, taskId } = args as {
						projectId: string;
						taskId: string;
					};
					const branches = await api.pluginGet<TaskBranch[]>(
						`projects/${projectId}/tasks/${taskId}/branches`,
					);
					return textResult(
						`Branches:\n\n${formatList(branches, formatBranch)}`,
					);
				}

				default:
					return errorResult(`Unknown tool: ${name}`);
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			return errorResult(`Forgejo plugin error: ${msg}`);
		}
	},
};

export default entry;
