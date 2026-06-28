import { type PluginApiClient } from "@paca-ai/plugin-sdk-react";

const PLUGIN_ID = "com.paca.forgejo";

export const ErrorCode = {
  ForgejoIntegrationNotFound: "FORGEJO_INTEGRATION_NOT_FOUND",
  ForgejoRepositoryNotFound: "FORGEJO_REPOSITORY_NOT_FOUND",
  ForgejoPRNotFound: "FORGEJO_PR_NOT_FOUND",
  ForgejoPRAlreadyLinked: "FORGEJO_PR_ALREADY_LINKED",
  ForgejoInvalidToken: "FORGEJO_INVALID_TOKEN",
  ForgejoRepoNotAccessible: "FORGEJO_REPO_NOT_ACCESSIBLE",
  ForgejoRepoAlreadyLinked: "FORGEJO_REPO_ALREADY_LINKED",
  ForgejoWebhookCreationFailed: "FORGEJO_WEBHOOK_CREATION_FAILED",
  ForgejoBranchAlreadyLinked: "FORGEJO_BRANCH_ALREADY_LINKED",
  ForgejoTokenInsufficientPermissions: "FORGEJO_TOKEN_INSUFFICIENT_PERMISSIONS",
  BadRequest: "BAD_REQUEST",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export function getPluginErrorCode(err: unknown): ErrorCodeValue | null {
  if (!(err instanceof Error)) return null;
  const arrowIdx = err.message.lastIndexOf("→ ");
  if (arrowIdx === -1) return null;
  const rest = err.message.slice(arrowIdx + 2);
  const colonIdx = rest.indexOf(": ");
  if (colonIdx === -1) return null;
  const maybeJson = rest.slice(colonIdx + 2);
  try {
    const body = JSON.parse(maybeJson) as { error_code?: string };
    const code = body.error_code;
    if (!code) return null;
    const known = Object.values(ErrorCode) as string[];
    return known.includes(code) ? (code as ErrorCodeValue) : null;
  } catch {
    return null;
  }
}

export interface ForgejoIntegration {
  id?: string;
  project_id: string;
  connected: boolean;
  provider?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccessibleRepo {
  full_name: string;
  owner: string;
  repo_name: string;
  default_branch: string;
  private: boolean;
}

export interface LinkedRepository {
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

export interface PullRequest {
  id: string;
  project_id: string;
  repo_id: string;
  pr_number: number;
  forgejo_pr_id: number;
  title: string;
  state: "open" | "closed" | "merged";
  html_url: string;
  head_branch: string;
  base_branch: string;
  author: string;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskBranch {
  id: string;
  task_id: string;
  repo_id: string;
  branch_name: string;
  created_at: string;
}

export interface CreateBranchResult {
  branch_name: string;
}

export const integrationKey = (projectId: string) =>
  [PLUGIN_ID, "integration", projectId] as const;

export const linkedReposKey = (projectId: string) =>
  [PLUGIN_ID, "linked-repos", projectId] as const;

export const accessibleReposKey = (projectId: string) =>
  [PLUGIN_ID, "accessible-repos", projectId] as const;

export const taskPRsKey = (projectId: string, taskId: string) =>
  [PLUGIN_ID, "prs", projectId, taskId] as const;

export const taskBranchesKey = (projectId: string, taskId: string) =>
  [PLUGIN_ID, "branches", projectId, taskId] as const;

export async function getForgejoIntegration(
  api: PluginApiClient,
): Promise<ForgejoIntegration> {
  return api.pluginGet<ForgejoIntegration>(PLUGIN_ID, `/projects/${api.projectId}/integration`);
}

export async function setForgejoToken(
  api: PluginApiClient,
  token: string,
  instanceUrl: string,
): Promise<ForgejoIntegration> {
  return api.pluginPost<ForgejoIntegration>(
    PLUGIN_ID,
    `/projects/${api.projectId}/integration/token`,
    { token, instance_url: instanceUrl },
  );
}

export async function deleteForgejoToken(api: PluginApiClient): Promise<void> {
  return api.pluginDelete(PLUGIN_ID, `/projects/${api.projectId}/integration/token`);
}

export async function listAccessibleRepos(
  api: PluginApiClient,
): Promise<AccessibleRepo[]> {
  return api.pluginGet<AccessibleRepo[]>(
    PLUGIN_ID,
    `/projects/${api.projectId}/integration/accessible-repos`,
  );
}

export async function linkRepository(
  api: PluginApiClient,
  owner: string,
  repoName: string,
): Promise<LinkedRepository> {
  return api.pluginPost<LinkedRepository>(
    PLUGIN_ID,
    `/projects/${api.projectId}/repositories`,
    { owner, repo_name: repoName },
  );
}

export async function listLinkedRepositories(
  api: PluginApiClient,
): Promise<LinkedRepository[]> {
  return api.pluginGet<LinkedRepository[]>(
    PLUGIN_ID,
    `/projects/${api.projectId}/repositories`,
  );
}

export async function unlinkRepository(
  api: PluginApiClient,
  repoId: string,
): Promise<void> {
  return api.pluginDelete(
    PLUGIN_ID,
    `/projects/${api.projectId}/repositories/${repoId}`,
  );
}

export async function listTaskPRs(
  api: PluginApiClient,
  taskId: string,
): Promise<PullRequest[]> {
  return api.pluginGet<PullRequest[]>(
    PLUGIN_ID,
    `/projects/${api.projectId}/tasks/${taskId}/pull-requests`,
  );
}

export async function linkPRToTask(
  api: PluginApiClient,
  taskId: string,
  repoId: string,
  prNumber: number,
): Promise<PullRequest> {
  return api.pluginPost<PullRequest>(
    PLUGIN_ID,
    `/projects/${api.projectId}/tasks/${taskId}/pull-requests/link`,
    { repo_id: repoId, pr_number: prNumber },
  );
}

export async function unlinkPRFromTask(
  api: PluginApiClient,
  taskId: string,
  prId: string,
): Promise<void> {
  return api.pluginDelete(
    PLUGIN_ID,
    `/projects/${api.projectId}/tasks/${taskId}/pull-requests/${prId}`,
  );
}

export async function listTaskBranches(
  api: PluginApiClient,
  taskId: string,
): Promise<TaskBranch[]> {
  return api.pluginGet<TaskBranch[]>(
    PLUGIN_ID,
    `/projects/${api.projectId}/tasks/${taskId}/branches`,
  );
}

export async function createBranch(
  api: PluginApiClient,
  taskId: string,
  repoId: string,
  branchName: string,
  sourceBranch?: string,
): Promise<CreateBranchResult> {
  return api.pluginPost<CreateBranchResult>(
    PLUGIN_ID,
    `/projects/${api.projectId}/tasks/${taskId}/branches`,
    { repo_id: repoId, branch_name: branchName, source_branch: sourceBranch },
  );
}
