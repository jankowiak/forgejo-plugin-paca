import { importShared } from './__federation_fn_import-CnoyXxDr.js';
import { j as jsxRuntimeExports } from './jsx-runtime-XI9uIe3W.js';
import { c as createLucideIcon, $, T, l as listLinkedRepositories, a as linkedReposKey, m as listTaskBranches, t as taskBranchesKey, b as GitBranch, L as LoaderCircle, n as listTaskPRs, o as taskPRsKey, G as GitPullRequest, P as Plus, d as getPluginErrorCode, E as ErrorCode, p as createBranch, q as unlinkPRFromTask, h as Trash2, r as linkPRToTask, C as Check } from './forgejo-api-BjmDm1s7.js';

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$6 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]];
const ChevronDown = createLucideIcon("chevron-down", __iconNode$6);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$5 = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]];
const ChevronRight = createLucideIcon("chevron-right", __iconNode$5);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$4 = [
  ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1", key: "tgr4d6" }],
  ["path", { d: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2", key: "4jdomd" }],
  ["path", { d: "M16 4h2a2 2 0 0 1 2 2v4", key: "3hqy98" }],
  ["path", { d: "M21 14H11", key: "1bme5i" }],
  ["path", { d: "m15 10-4 4 4 4", key: "5dvupr" }]
];
const ClipboardCopy = createLucideIcon("clipboard-copy", __iconNode$4);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$3 = [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "M10 14 21 3", key: "gplh6r" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
];
const ExternalLink = createLucideIcon("external-link", __iconNode$3);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$2 = [
  ["circle", { cx: "18", cy: "18", r: "3", key: "1xkwt0" }],
  ["circle", { cx: "6", cy: "6", r: "3", key: "1lh9wr" }],
  ["path", { d: "M6 21V9a9 9 0 0 0 9 9", key: "7kw0sc" }]
];
const GitMerge = createLucideIcon("git-merge", __iconNode$2);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$1 = [
  ["circle", { cx: "6", cy: "6", r: "3", key: "1lh9wr" }],
  ["path", { d: "M6 9v12", key: "1sc30k" }],
  ["path", { d: "m21 3-6 6", key: "16nqsk" }],
  ["path", { d: "m21 9-6-6", key: "9j17rh" }],
  ["path", { d: "M18 11.5V15", key: "65xf6f" }],
  ["circle", { cx: "18", cy: "18", r: "3", key: "1xkwt0" }]
];
const GitPullRequestClosed = createLucideIcon("git-pull-request-closed", __iconNode$1);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode = [
  ["path", { d: "M12 19h8", key: "baeox8" }],
  ["path", { d: "m4 17 6-6-6-6", key: "1yngyt" }]
];
const Terminal = createLucideIcon("terminal", __iconNode);

const {useMutation,useQuery,useQueryClient} = await importShared('@tanstack/react-query');
const {useMemo,useState} = await importShared('react');
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
function PRStateBadge({ state }) {
  if (state === "merged") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(GitMerge, { className: "size-3" }),
      "Merged"
    ] });
  }
  if (state === "closed") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive/80", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(GitPullRequestClosed, { className: "size-3" }),
      "Closed"
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(GitPullRequest, { className: "size-3" }),
    "Open"
  ] });
}
function PRRow({
  api,
  pr,
  projectId,
  taskId,
  canEdit
}) {
  const queryClient = useQueryClient();
  const unlinkMutation = useMutation({
    mutationFn: () => unlinkPRFromTask(api, taskId, pr.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskPRsKey(projectId, taskId)
      });
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group flex items-start gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2.5 hover:border-border/80 transition-colors", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PRStateBadge, { state: pr.state }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href: pr.html_url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: pr.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3 shrink-0 opacity-50" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground font-mono", children: [
          "#",
          pr.pr_number
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground/40", children: "·" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: pr.head_branch }),
        pr.author && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground/40", children: "·" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            "by ",
            pr.author
          ] })
        ] })
      ] })
    ] }),
    canEdit && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        "aria-label": "Unlink pull request",
        className: "shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/60 hover:text-destructive",
        onClick: () => unlinkMutation.mutate(),
        disabled: unlinkMutation.isPending,
        children: unlinkMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
      }
    )
  ] });
}
function parseForgejoPRUrl(raw) {
  try {
    const url = new URL(raw.trim());
    const parts = url.pathname.replace(/^\//, "").split("/");
    if (parts.length < 4 || ![void 0, "pulls", "pull"].includes(parts[2]))
      return null;
    const prNumber = Number(parts[3]);
    if (!Number.isInteger(prNumber) || prNumber <= 0) return null;
    return { fullName: `${parts[0]}/${parts[1]}`, prNumber };
  } catch {
    return null;
  }
}
function LinkPRForm({
  api,
  projectId,
  taskId,
  repos,
  onDone
}) {
  const queryClient = useQueryClient();
  const [selectedRepoId, setSelectedRepoId] = useState(
    repos.length === 1 ? repos[0].id : ""
  );
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);
  const parsed = parseForgejoPRUrl(value);
  const urlMatchedRepo = parsed ? repos.find((r) => r.full_name === parsed.fullName) ?? null : null;
  const effectiveRepoId = parsed ? urlMatchedRepo?.id ?? "" : selectedRepoId;
  const mutation = useMutation({
    mutationFn: () => {
      const prNum = parsed ? parsed.prNumber : Number(value);
      return linkPRToTask(api, taskId, effectiveRepoId, prNum);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: taskPRsKey(projectId, taskId)
      });
      setValue("");
      setError(null);
      onDone();
    },
    onError: (err) => {
      const code = getPluginErrorCode(err);
      if (code === ErrorCode.ForgejoIntegrationNotFound) {
        setError("No Forgejo token configured for this project.");
        return;
      }
      if (code === ErrorCode.ForgejoRepositoryNotFound) {
        setError("Repository not found. It may have been unlinked.");
        return;
      }
      if (code === ErrorCode.ForgejoPRNotFound) {
        const displayNum = parsed ? parsed.prNumber : value;
        setError(
          `PR #${displayNum} was not found in the selected repository.`
        );
        return;
      }
      if (code === ErrorCode.ForgejoPRAlreadyLinked) {
        const displayNum = parsed ? parsed.prNumber : value;
        setError(`PR #${displayNum} is already linked to this task.`);
        return;
      }
      if (code === ErrorCode.ForgejoTokenInsufficientPermissions) {
        setError(
          "Your Forgejo token does not have permission to read pull requests. Update it in Project Settings > Forgejo."
        );
        return;
      }
      setError("Failed to link pull request. Please try again.");
    }
  });
  function submit() {
    if (parsed) {
      if (!urlMatchedRepo) {
        setError(
          `Repository "${parsed.fullName}" is not linked to this project.`
        );
        return;
      }
    } else {
      if (!effectiveRepoId) {
        setError("Select a repository.");
        return;
      }
      const num = Number(value);
      if (!value.trim() || !Number.isInteger(num) || num <= 0) {
        setError(
          "Enter a valid PR number or paste a Forgejo PR URL."
        );
        return;
      }
    }
    mutation.mutate();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-lg border border-border/50 bg-card px-3 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-1", children: "Repository" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: parsed ? urlMatchedRepo?.id ?? "" : selectedRepoId,
          onChange: (e) => {
            setSelectedRepoId(e.target.value);
            setError(null);
          },
          disabled: mutation.isPending || !!parsed,
          className: "w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select repository…" }),
            repos.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.id, children: r.full_name }, r.id))
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-1", children: "PR number or URL" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          value,
          onChange: (e) => {
            setValue(e.target.value);
            setError(null);
          },
          onKeyDown: (e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onDone();
          },
          placeholder: "42 or https://forgejo.example.org/owner/repo/pulls/42",
          className: cn(
            "w-full rounded-md border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring",
            error ? "border-destructive" : "border-border/60"
          ),
          autoFocus: true,
          disabled: mutation.isPending
        }
      ),
      parsed && urlMatchedRepo && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
        "Will link PR #",
        parsed.prNumber,
        " from",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: urlMatchedRepo.full_name })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive/80 leading-relaxed", children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 pt-0.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: submit,
          disabled: !value.trim() || mutation.isPending,
          className: "flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors",
          children: [
            mutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(GitPullRequest, { className: "size-3.5" }),
            "Link pull request"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: onDone,
          className: "text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors",
          children: "Cancel"
        }
      )
    ] })
  ] });
}
function PullRequestsSection({
  api,
  projectId,
  taskId,
  canEdit
}) {
  const { data: prs = [], isLoading } = useQuery({
    queryKey: taskPRsKey(projectId, taskId),
    queryFn: () => listTaskPRs(api, taskId),
    retry: false,
    throwOnError: false
  });
  const { data: linkedRepos = [] } = useQuery({
    queryKey: linkedReposKey(projectId),
    queryFn: () => listLinkedRepositories(api),
    retry: false,
    throwOnError: false
  });
  const [expanded, setExpanded] = useState(true);
  const [linking, setLinking] = useState(false);
  const count = prs.length;
  const canLinkPR = canEdit && linkedRepos.length > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 mb-3 hover:text-muted-foreground transition-colors",
        onClick: () => setExpanded((v) => !v),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(GitPullRequest, { className: "size-3.5 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Pull Requests" }),
          count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground normal-case tracking-normal", children: count }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-linear-to-r from-border/40 to-transparent" }),
          expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3.5 shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3.5 shrink-0" })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 py-2 text-muted-foreground/60 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }),
      "Loading…"
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      prs.map((pr) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        PRRow,
        {
          api,
          pr,
          projectId,
          taskId,
          canEdit
        },
        pr.id
      )),
      count === 0 && !linking && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground/50 italic py-1", children: "No pull requests linked yet." }),
      linking ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        LinkPRForm,
        {
          api,
          projectId,
          taskId,
          repos: linkedRepos,
          onDone: () => setLinking(false)
        }
      ) : canLinkPR && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1",
          onClick: () => setLinking(true),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" }),
            "Link pull request"
          ]
        }
      )
    ] }) })
  ] });
}
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(text)?.catch(() => {
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      "aria-label": "Copy to clipboard",
      onClick: handleCopy,
      className: "shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors",
      children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3.5 text-emerald-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardCopy, { className: "size-3.5" })
    }
  );
}
function CommandBlock({ command }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-md bg-muted/60 border border-border/50 px-3 py-2 mt-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Terminal, { className: "size-3.5 shrink-0 text-muted-foreground/50" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "flex-1 text-xs font-mono text-foreground/80 break-all", children: command }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CopyButton, { text: command })
  ] });
}
function BranchRow({ branch }) {
  const cloneCmd = `git fetch origin && git checkout ${branch.branch_name}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/50 bg-card px-3 py-2.5 space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(GitBranch, { className: "size-3.5 shrink-0 text-muted-foreground/60" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono truncate text-foreground/90 flex-1", children: branch.branch_name })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CommandBlock, { command: cloneCmd })
  ] });
}
const BRANCH_TYPES = [
  "feat",
  "fix",
  "chore",
  "docs",
  "test",
  "refactor"
];
function CreateBranchForm({
  api,
  projectId,
  taskId,
  taskIdPrefix,
  taskNumber,
  taskTitle,
  repos,
  onDone
}) {
  const queryClient = useQueryClient();
  const taskRef = taskIdPrefix ? `${taskIdPrefix.toUpperCase()}-${taskNumber}` : `${taskNumber}`;
  const defaultSlug = taskTitle ? `-${taskTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30)}` : "";
  const [type, setType] = useState("feat");
  const [branchName, setBranchName] = useState(
    `${type}/${taskRef}${defaultSlug}`
  );
  const [selectedRepoId, setSelectedRepoId] = useState(
    repos.length === 1 ? repos[0].id : ""
  );
  const [sourceBranch, setSourceBranch] = useState("");
  const [error, setError] = useState(null);
  function handleTypeChange(newType) {
    setType(newType);
    setBranchName((prev) => {
      const slash = prev.indexOf("/");
      const rest = slash >= 0 ? prev.slice(slash) : `/${taskRef}`;
      return `${newType}${rest}`;
    });
  }
  const createMutation = useMutation({
    mutationFn: () => createBranch(
      api,
      taskId,
      selectedRepoId,
      branchName,
      sourceBranch || void 0
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskBranchesKey(projectId, taskId)
      });
      onDone();
    },
    onError: (err) => {
      const code = getPluginErrorCode(err);
      if (code === ErrorCode.ForgejoIntegrationNotFound) {
        setError("No Forgejo token configured for this project.");
        return;
      }
      if (code === ErrorCode.ForgejoRepositoryNotFound) {
        setError("Repository not found. It may have been unlinked.");
        return;
      }
      if (code === ErrorCode.ForgejoBranchAlreadyLinked) {
        setError("This branch is already linked to the task.");
        return;
      }
      if (code === ErrorCode.ForgejoTokenInsufficientPermissions) {
        setError(
          "Your Forgejo token does not have permission to create branches. Please update it in Project Settings > Forgejo."
        );
        return;
      }
      setError("Failed to create branch. Please try again.");
    }
  });
  const localCmd = `git checkout -b ${branchName} && git push -u origin ${branchName}`;
  function validateForm() {
    if (!branchName.trim()) {
      setError("Branch name is required.");
      return false;
    }
    if (repos.length > 1 && !selectedRepoId) {
      setError("Select a repository.");
      return false;
    }
    return true;
  }
  function handleCreate() {
    setError(null);
    if (!validateForm()) return;
    createMutation.mutate();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-lg border border-border/50 bg-card px-3 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-1.5", children: "Type" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: BRANCH_TYPES.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => handleTypeChange(t),
          className: cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
            t === type ? "border-primary/60 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border"
          ),
          children: t
        },
        t
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-1", children: "Branch name" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          value: branchName,
          onChange: (e) => {
            setBranchName(e.target.value);
            setError(null);
          },
          placeholder: `feat/${taskRef}`,
          className: "w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring",
          spellCheck: false
        }
      )
    ] }),
    repos.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-1", children: "Repository" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: selectedRepoId,
          onChange: (e) => setSelectedRepoId(e.target.value),
          className: "w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select repository…" }),
            repos.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.id, children: r.full_name }, r.id))
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mb-1", children: [
        "Source branch",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "opacity-60", children: "(optional, defaults to repo default)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          value: sourceBranch,
          onChange: (e) => setSourceBranch(e.target.value),
          placeholder: "main",
          className: "w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring",
          spellCheck: false
        }
      )
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive/80 leading-relaxed", children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 pt-0.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          disabled: createMutation.isPending,
          onClick: handleCreate,
          className: "flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors",
          children: [
            createMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(GitBranch, { className: "size-3.5" }),
            "Create branch on Forgejo"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-0.5", children: "Or create locally:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CommandBlock, { command: localCmd })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors",
        onClick: onDone,
        children: "Cancel"
      }
    )
  ] });
}
function BranchesSection({
  api,
  projectId,
  taskId,
  taskIdPrefix,
  taskNumber,
  taskTitle,
  canEdit
}) {
  const [expanded, setExpanded] = useState(true);
  const [creating, setCreating] = useState(false);
  const { data: branches = [], isLoading } = useQuery({
    queryKey: taskBranchesKey(projectId, taskId),
    queryFn: () => listTaskBranches(api, taskId),
    retry: false,
    throwOnError: false
  });
  const { data: linkedRepos = [] } = useQuery({
    queryKey: linkedReposKey(projectId),
    queryFn: () => listLinkedRepositories(api),
    retry: false,
    throwOnError: false
  });
  const count = branches.length;
  const canCreate = canEdit && linkedRepos.length > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 mb-3 hover:text-muted-foreground transition-colors",
        onClick: () => setExpanded((v) => !v),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(GitBranch, { className: "size-3.5 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Branches" }),
          count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground normal-case tracking-normal", children: count }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-linear-to-r from-border/40 to-transparent" }),
          expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3.5 shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3.5 shrink-0" })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 py-2 text-muted-foreground/60 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }),
      "Loading…"
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      branches.map((branch) => /* @__PURE__ */ jsxRuntimeExports.jsx(BranchRow, { branch }, branch.id)),
      count === 0 && !creating && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground/50 italic py-1", children: "No branches linked yet." }),
      creating ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        CreateBranchForm,
        {
          api,
          projectId,
          taskId,
          taskIdPrefix,
          taskNumber,
          taskTitle,
          repos: linkedRepos,
          onDone: () => setCreating(false)
        }
      ) : canCreate && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1",
          onClick: () => setCreating(true),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(GitBranch, { className: "size-3.5" }),
            "Create branch"
          ]
        }
      )
    ] }) })
  ] });
}
function ForgejoTaskSectionInner({
  api,
  projectId,
  taskId,
  canEdit
}) {
  const { data: task } = useQuery({
    queryKey: ["plugin", "task", taskId],
    queryFn: () => api.getTask(taskId),
    staleTime: 6e4
  });
  const { data: project } = useQuery({
    queryKey: ["plugin", "project", projectId],
    queryFn: () => api.getProject(),
    staleTime: 6e4
  });
  const { data: linkedRepos, isLoading: reposLoading } = useQuery({
    queryKey: linkedReposKey(projectId),
    queryFn: () => listLinkedRepositories(api),
    retry: false,
    throwOnError: false
  });
  const taskIdPrefix = project?.task_id_prefix ?? "";
  const taskNumber = task?.task_number ?? 0;
  const taskTitle = task?.title;
  if (reposLoading) return null;
  if (!linkedRepos || linkedRepos.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      BranchesSection,
      {
        api,
        projectId,
        taskId,
        taskIdPrefix,
        taskNumber,
        taskTitle,
        canEdit
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PullRequestsSection,
      {
        api,
        projectId,
        taskId,
        canEdit
      }
    )
  ] });
}
function ForgejoTaskSection({
  projectId,
  taskId,
  canEdit = true
}) {
  const api = useMemo(
    () => new $({
      baseUrl: `${window.location.origin}/api/v1`,
      projectId,
      fetch: (url, init) => window.fetch(url, { ...init, credentials: "include" })
    }),
    [projectId]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(T, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    ForgejoTaskSectionInner,
    {
      api,
      projectId,
      taskId,
      canEdit
    }
  ) });
}

export { ForgejoTaskSection as default };
