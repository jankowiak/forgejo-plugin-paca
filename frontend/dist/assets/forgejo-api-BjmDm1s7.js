import { importShared } from './__federation_fn_import-CnoyXxDr.js';
import { j as jsxRuntimeExports } from './jsx-runtime-XI9uIe3W.js';

const {createContext:c,useContext:l,useMemo:_} = await importShared('react');

const {QueryClient:h,QueryClientProvider:d,useQuery:P} = await importShared('@tanstack/react-query');

class $ {
  constructor(e) {
    this.baseUrl = e.baseUrl.replace(/\/$/, ""), this.projectId = e.projectId, this._fetch = e.fetch;
  }
  // ── Core read-only helpers ──────────────────────────────────────────────
  /** List tasks for the current project with optional filters. */
  async listTasks(e = {}) {
    var o, a;
    const t = new URLSearchParams();
    (o = e.status_ids) != null && o.length && t.set("status_ids", e.status_ids.join(",")), (a = e.assignee_ids) != null && a.length && t.set("assignee_ids", e.assignee_ids.join(",")), e.sprint_id && t.set("sprint_id", e.sprint_id), e.parent_task_id && t.set("parent_task_id", e.parent_task_id), e.page && t.set("page", String(e.page)), e.page_size && t.set("page_size", String(e.page_size));
    const s = t.toString(), r = `${this.baseUrl}/projects/${this.projectId}/tasks${s ? `?${s}` : ""}`;
    return (await this._get(r)).tasks;
  }
  /** Get a single task by ID. */
  async getTask(e) {
    return this._get(
      `${this.baseUrl}/projects/${this.projectId}/tasks/${e}`
    );
  }
  /** Get the current project summary. */
  async getProject() {
    return this._get(
      `${this.baseUrl}/projects/${this.projectId}`
    );
  }
  /** List members of the current project. */
  async listMembers() {
    return (await this._get(
      `${this.baseUrl}/projects/${this.projectId}/members`
    )).members;
  }
  // ── Plugin route helpers ────────────────────────────────────────────────
  /**
   * Call a GET route registered by this plugin.
   * The URL is built as `{baseUrl}/plugins/{pluginId}{path}`.
   * For project-scoped routes, include the project prefix in `path`:
   *   `pluginGet(id, \`/projects/${api.projectId}/resource\`)`
   */
  async pluginGet(e, t) {
    return this._get(this._pluginUrl(e, t));
  }
  /**
   * Call a POST route registered by this plugin.
   */
  async pluginPost(e, t, s) {
    return this._request("POST", this._pluginUrl(e, t), s);
  }
  /**
   * Call a PATCH route registered by this plugin.
   */
  async pluginPatch(e, t, s) {
    return this._request("PATCH", this._pluginUrl(e, t), s);
  }
  /**
   * Call a DELETE route registered by this plugin.
   */
  async pluginDelete(e, t) {
    await this._request(
      "DELETE",
      this._pluginUrl(e, t),
      void 0
    );
  }
  // ── Internals ───────────────────────────────────────────────────────────
  _pluginUrl(e, t) {
    const s = t.startsWith("/") ? t : `/${t}`;
    return `${this.baseUrl}/plugins/${e}${s}`;
  }
  async _get(e) {
    return this._request("GET", e, void 0);
  }
  async _request(e, t, s) {
    const r = {
      method: e,
      headers: { "Content-Type": "application/json" }
    };
    s !== void 0 && (r.body = JSON.stringify(s));
    const i = await this._fetch(t, r);
    if (!i.ok) {
      const a = await i.text().catch(() => i.statusText);
      throw new Error(
        `[PluginApiClient] ${e} ${t} → ${i.status}: ${a}`
      );
    }
    return i.status === 204 ? void 0 : (await i.json()).data;
  }
}
c(null);
const p = c(null);
function T({
  children: n,
  queryClient: e
}) {
  const t = _(
    () => new h({
      defaultOptions: {
        queries: { retry: 1, staleTime: 3e4 }
      }
    }),
    []
  ), s = e ?? t;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(p.Provider, { value: s, children: /* @__PURE__ */ jsxRuntimeExports.jsx(d, { client: s, children: n }) });
}

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */

const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const toCamelCase = (string) => string.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
);
const toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
const mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
const hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
};

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */

var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */

const {forwardRef: forwardRef$1,createElement: createElement$1} = await importShared('react');

const Icon = forwardRef$1(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => createElement$1(
    "svg",
    {
      ref,
      ...defaultAttributes,
      width: size,
      height: size,
      stroke: color,
      strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
      className: mergeClasses("lucide", className),
      ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
      ...rest
    },
    [
      ...iconNode.map(([tag, attrs]) => createElement$1(tag, attrs)),
      ...Array.isArray(children) ? children : [children]
    ]
  )
);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */

const {forwardRef,createElement} = await importShared('react');

const createLucideIcon = (iconName, iconNode) => {
  const Component = forwardRef(
    ({ className, ...props }, ref) => createElement(Icon, {
      ref,
      iconNode,
      className: mergeClasses(
        `lucide-${toKebabCase(toPascalCase(iconName))}`,
        `lucide-${iconName}`,
        className
      ),
      ...props
    })
  );
  Component.displayName = toPascalCase(iconName);
  return Component;
};

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$5 = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
const Check = createLucideIcon("check", __iconNode$5);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$4 = [
  ["line", { x1: "6", x2: "6", y1: "3", y2: "15", key: "17qcm7" }],
  ["circle", { cx: "18", cy: "6", r: "3", key: "1h7g24" }],
  ["circle", { cx: "6", cy: "18", r: "3", key: "fqmcym" }],
  ["path", { d: "M18 9a9 9 0 0 1-9 9", key: "n2h4wq" }]
];
const GitBranch = createLucideIcon("git-branch", __iconNode$4);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$3 = [
  ["circle", { cx: "18", cy: "18", r: "3", key: "1xkwt0" }],
  ["circle", { cx: "6", cy: "6", r: "3", key: "1lh9wr" }],
  ["path", { d: "M13 6h3a2 2 0 0 1 2 2v7", key: "1yeb86" }],
  ["line", { x1: "6", x2: "6", y1: "9", y2: "21", key: "rroup" }]
];
const GitPullRequest = createLucideIcon("git-pull-request", __iconNode$3);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$2 = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]];
const LoaderCircle = createLucideIcon("loader-circle", __iconNode$2);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$1 = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
const Plus = createLucideIcon("plus", __iconNode$1);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
];
const Trash2 = createLucideIcon("trash-2", __iconNode);

const PLUGIN_ID = "com.paca.forgejo";
const ErrorCode = {
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
  BadRequest: "BAD_REQUEST"
};
function getPluginErrorCode(err) {
  if (!(err instanceof Error)) return null;
  const arrowIdx = err.message.lastIndexOf("→ ");
  if (arrowIdx === -1) return null;
  const rest = err.message.slice(arrowIdx + 2);
  const colonIdx = rest.indexOf(": ");
  if (colonIdx === -1) return null;
  const maybeJson = rest.slice(colonIdx + 2);
  try {
    const body = JSON.parse(maybeJson);
    const code = body.error_code;
    if (!code) return null;
    const known = Object.values(ErrorCode);
    return known.includes(code) ? code : null;
  } catch {
    return null;
  }
}
const integrationKey = (projectId) => [PLUGIN_ID, "integration", projectId];
const linkedReposKey = (projectId) => [PLUGIN_ID, "linked-repos", projectId];
const accessibleReposKey = (projectId) => [PLUGIN_ID, "accessible-repos", projectId];
const taskPRsKey = (projectId, taskId) => [PLUGIN_ID, "prs", projectId, taskId];
const taskBranchesKey = (projectId, taskId) => [PLUGIN_ID, "branches", projectId, taskId];
async function getForgejoIntegration(api) {
  return api.pluginGet(PLUGIN_ID, `/projects/${api.projectId}/integration`);
}
async function setForgejoToken(api, token, instanceUrl) {
  return api.pluginPost(
    PLUGIN_ID,
    `/projects/${api.projectId}/integration/token`,
    { token, instance_url: instanceUrl }
  );
}
async function deleteForgejoToken(api) {
  return api.pluginDelete(PLUGIN_ID, `/projects/${api.projectId}/integration/token`);
}
async function listAccessibleRepos(api) {
  return api.pluginGet(
    PLUGIN_ID,
    `/projects/${api.projectId}/integration/accessible-repos`
  );
}
async function linkRepository(api, owner, repoName) {
  return api.pluginPost(
    PLUGIN_ID,
    `/projects/${api.projectId}/repositories`,
    { owner, repo_name: repoName }
  );
}
async function listLinkedRepositories(api) {
  return api.pluginGet(
    PLUGIN_ID,
    `/projects/${api.projectId}/repositories`
  );
}
async function unlinkRepository(api, repoId) {
  return api.pluginDelete(
    PLUGIN_ID,
    `/projects/${api.projectId}/repositories/${repoId}`
  );
}
async function listTaskPRs(api, taskId) {
  return api.pluginGet(
    PLUGIN_ID,
    `/projects/${api.projectId}/tasks/${taskId}/pull-requests`
  );
}
async function linkPRToTask(api, taskId, repoId, prNumber) {
  return api.pluginPost(
    PLUGIN_ID,
    `/projects/${api.projectId}/tasks/${taskId}/pull-requests/link`,
    { repo_id: repoId, pr_number: prNumber }
  );
}
async function unlinkPRFromTask(api, taskId, prId) {
  return api.pluginDelete(
    PLUGIN_ID,
    `/projects/${api.projectId}/tasks/${taskId}/pull-requests/${prId}`
  );
}
async function listTaskBranches(api, taskId) {
  return api.pluginGet(
    PLUGIN_ID,
    `/projects/${api.projectId}/tasks/${taskId}/branches`
  );
}
async function createBranch(api, taskId, repoId, branchName, sourceBranch) {
  return api.pluginPost(
    PLUGIN_ID,
    `/projects/${api.projectId}/tasks/${taskId}/branches`,
    { repo_id: repoId, branch_name: branchName, source_branch: sourceBranch }
  );
}

export { $, Check as C, ErrorCode as E, GitPullRequest as G, LoaderCircle as L, Plus as P, T, linkedReposKey as a, GitBranch as b, createLucideIcon as c, getPluginErrorCode as d, accessibleReposKey as e, deleteForgejoToken as f, getForgejoIntegration as g, Trash2 as h, integrationKey as i, listAccessibleRepos as j, linkRepository as k, listLinkedRepositories as l, listTaskBranches as m, listTaskPRs as n, taskPRsKey as o, createBranch as p, unlinkPRFromTask as q, linkPRToTask as r, setForgejoToken as s, taskBranchesKey as t, unlinkRepository as u };
