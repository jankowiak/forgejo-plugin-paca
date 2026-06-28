import { PluginApiClient, PluginQueryClientProvider } from "@paca-ai/plugin-sdk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Check,
  GitBranch,
  GitPullRequest,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  type AccessibleRepo,
  accessibleReposKey,
  deleteForgejoToken,
  ErrorCode,
  getPluginErrorCode,
  type ForgejoIntegration,
  getForgejoIntegration,
  integrationKey,
  type LinkedRepository,
  linkedReposKey,
  listAccessibleRepos,
  listLinkedRepositories,
  linkRepository,
  setForgejoToken,
  unlinkRepository,
} from "./forgejo-api";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

function ForgejoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Forgejo</title>
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l5.59-5.59L18 10l-7 7z"
      />
    </svg>
  );
}

function Btn({
  children,
  variant = "default",
  size = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "destructive" | "ghost";
  size?: "default" | "sm";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
  };
  return (
    <button
      type="button"
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

function Inp({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[7.5vh] p-4 overflow-y-auto"
      onClick={onClose}
    >
      {children}
    </div>
  );
}

function ModalContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "relative z-10 mx-auto flex flex-col max-h-[85vh] lg:h-[85vh] overflow-hidden rounded-lg border border-border bg-background shadow-xl w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

function TokenCard({
  api,
  projectId,
  hasIntegration,
  onTokenSet,
  canEdit,
}: {
  api: PluginApiClient;
  projectId: string;
  hasIntegration: boolean;
  onTokenSet: () => void;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [instanceUrl, setInstanceUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      setForgejoToken(api, token.trim(), instanceUrl.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: integrationKey(projectId),
      });
      setToken("");
      setInstanceUrl("");
      setError(null);
      onTokenSet();
    },
    onError: (err: unknown) => {
      const code = getPluginErrorCode(err);
      if (code === ErrorCode.ForgejoInvalidToken) {
        setError(
          "Forgejo rejected the token. Check the token is valid and has the required scopes.",
        );
        return;
      }
      setError("Failed to save token. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteForgejoToken(api),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: integrationKey(projectId),
      });
      await queryClient.removeQueries({
        queryKey: linkedReposKey(projectId),
      });
      await queryClient.removeQueries({
        queryKey: accessibleReposKey(projectId),
      });
      setConfirmOpen(false);
    },
    onError: () => {
      setError("Failed to remove token. Please try again.");
    },
  });

  if (hasIntegration) {
    return (
      <>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="size-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Personal access token saved</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Token is stored encrypted. It is never returned by the API.
              </p>
            </div>
          </div>
          {canEdit && (
            <Btn
              variant="outline"
              size="sm"
              className="shrink-0 text-destructive/80 hover:text-destructive border-destructive/30 hover:border-destructive/50"
              onClick={() => setConfirmOpen(true)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Remove token
            </Btn>
          )}
        </div>

        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <ModalContent className="max-w-sm p-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 mb-2">
              <KeyRound className="size-5 text-destructive" />
            </div>
            <h2 className="text-base font-semibold leading-none mb-1.5">
              Remove Forgejo token
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Removing the token will also unlink all repositories and disable
              webhook events. This action cannot be undone.
            </p>
            {deleteMutation.isError && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">
                Failed to remove token. Please try again.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Btn
                variant="outline"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Btn>
              <Btn
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Removing…
                  </>
                ) : (
                  "Remove token"
                )}
              </Btn>
            </div>
          </ModalContent>
        </Modal>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add a Forgejo personal access token and instance URL to link
        repositories, create branches, and track pull requests.
      </p>
      <div className="flex flex-col gap-2 max-w-lg">
        <Inp
          type="text"
          value={instanceUrl}
          onChange={(e) => {
            setInstanceUrl(e.target.value);
            setError(null);
          }}
          placeholder="https://forgejo.example.org"
          disabled={!canEdit || saveMutation.isPending}
          className={cn(error ? "border-destructive focus-visible:ring-destructive/30" : "")}
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Enter" && token.trim() && instanceUrl.trim()) saveMutation.mutate();
          }}
        />
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Inp
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError(null);
              }}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              disabled={!canEdit || saveMutation.isPending}
              className={cn(
                "pr-8 font-mono text-sm",
                error ? "border-destructive focus-visible:ring-destructive/30" : "",
              )}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter" && token.trim() && instanceUrl.trim()) saveMutation.mutate();
              }}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground text-xs font-medium"
              onClick={() => setShowToken((v) => !v)}
              tabIndex={-1}
            >
              {showToken ? "hide" : "show"}
            </button>
          </div>
          <Btn
            size="sm"
            disabled={!token.trim() || !instanceUrl.trim() || !canEdit || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="shrink-0"
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : null}
            Save token
          </Btn>
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function AddRepoDialog({
  api,
  projectId,
  open,
  onOpenChange,
}: {
  api: PluginApiClient;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const {
    data: repos = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: accessibleReposKey(projectId),
    queryFn: () => listAccessibleRepos(api),
    enabled: open,
    staleTime: 0,
  });
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const linkMutation = useMutation({
    mutationFn: (repo: AccessibleRepo) =>
      linkRepository(api, repo.owner, repo.repo_name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: linkedReposKey(projectId),
      });
      setError(null);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const code = getPluginErrorCode(err);
      if (code === ErrorCode.ForgejoWebhookCreationFailed) {
        setError(
          "Could not create the webhook. Make sure your token has admin access to the repository.",
        );
        return;
      }
      if (code === ErrorCode.ForgejoRepoAlreadyLinked) {
        setError("This repository is already linked to the project.");
        return;
      }
      if (code === ErrorCode.ForgejoRepoNotAccessible) {
        setError(
          "Repository not found or not accessible. Check that your token has the required permissions.",
        );
        return;
      }
      setError("Failed to link repository. Please try again.");
    },
  });

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSearch("");
      setError(null);
    }
    onOpenChange(next);
  }

  return (
    <Modal open={open} onClose={() => handleOpenChange(false)}>
      <ModalContent className="max-w-lg p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <GitBranch className="size-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold">Add repository</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Select a repository from your Forgejo account to link to this project.
          A webhook will be registered automatically.
        </p>

        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
            <Inp
              placeholder="Search repositories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
              // biome-ignore lint/a11y/noAutofocus: intentional dialog autofocus
              autoFocus
            />
          </div>
          <button
            type="button"
            aria-label="Reload repositories"
            disabled={isFetching}
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            onClick={() =>
              queryClient.refetchQueries({
                queryKey: accessibleReposKey(projectId),
              })
            }
          >
            {isFetching ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
          </button>
        </div>

        {error ? (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        ) : null}

        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb]:hover:bg-border">
          <div className="space-y-1 pr-0.5">
            {isLoading ? (
              [0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg mb-1" />
              ))
            ) : repos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground/60">
                <BookOpen className="size-8" />
                <p className="text-sm">No accessible repositories found.</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground/60 py-10">
                No repositories match &ldquo;{search}&rdquo
              </p>
            ) : (
              filtered.map((repo) => (
                <button
                  key={repo.full_name}
                  type="button"
                  disabled={linkMutation.isPending}
                  onClick={() => linkMutation.mutate(repo)}
                  className="w-full flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3.5 py-3 text-left hover:border-border hover:bg-muted/40 transition-colors disabled:opacity-60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <GitBranch className="size-3.5 text-muted-foreground/70 shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {repo.full_name}
                      </span>
                      {repo.private && (
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                  {linkMutation.isPending &&
                  linkMutation.variables?.full_name === repo.full_name ? (
                    <Loader2 className="size-3.5 animate-spin shrink-0 text-muted-foreground" />
                  ) : (
                    <Plus className="size-3.5 shrink-0 text-muted-foreground/40" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Btn
            variant="outline"
            size="sm"
            disabled={linkMutation.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Close
          </Btn>
        </div>
      </ModalContent>
    </Modal>
  );
}

function LinkedRepoItem({
  api,
  projectId,
  repo,
  canEdit,
}: {
  api: PluginApiClient;
  projectId: string;
  repo: LinkedRepository;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const unlinkMutation = useMutation({
    mutationFn: () => unlinkRepository(api, repo.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: linkedReposKey(projectId),
      });
      setConfirmOpen(false);
    },
  });

  const repoURL = `https://${repo.instance_url}/${repo.full_name}`;

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-3.5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <GitBranch className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <a
              href={repoURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline truncate block"
            >
              {repo.full_name}
            </a>
            <p className="text-xs text-muted-foreground mt-0.5">
              Default branch:{" "}
              <code className="font-mono">{repo.default_branch}</code>
              {" · "}
              <span className="font-mono">{repo.instance_url}</span>
            </p>
          </div>
        </div>
        {canEdit && (
          <Btn
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Unlink className="size-3.5" />
            Unlink
          </Btn>
        )}
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <ModalContent className="max-w-sm p-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 mb-2">
            <Unlink className="size-5 text-destructive" />
          </div>
          <h2 className="text-base font-semibold leading-none mb-1.5">
            Unlink repository
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This will remove the link to{" "}
            <span className="font-semibold text-foreground">
              {repo.full_name}
            </span>{" "}
            and attempt to delete the webhook from Forgejo.
          </p>
          {unlinkMutation.isError && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">
              Failed to unlink. Please try again.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Btn
              variant="outline"
              size="sm"
              disabled={unlinkMutation.isPending}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Btn>
            <Btn
              variant="destructive"
              size="sm"
              disabled={unlinkMutation.isPending}
              onClick={() => unlinkMutation.mutate()}
            >
              {unlinkMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Unlinking…
                </>
              ) : (
                "Unlink repository"
              )}
            </Btn>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}

function ForgejoSettingsInner({
  api,
  projectId,
  canEdit,
}: {
  api: PluginApiClient;
  projectId: string;
  canEdit: boolean;
}) {
  const { data: integration, isLoading: integrationLoading } = useQuery<
    ForgejoIntegration | undefined
  >({
    queryKey: integrationKey(projectId),
    queryFn: () => getForgejoIntegration(api),
    retry: false,
    throwOnError: false,
  });

  const { data: linkedRepos = [], isLoading: reposLoading } = useQuery<
    LinkedRepository[]
  >({
    queryKey: linkedReposKey(projectId),
    queryFn: () => listLinkedRepositories(api),
    retry: false,
    throwOnError: false,
    enabled: !!integration,
  });

  const queryClient = useQueryClient();
  const hasIntegration = integration?.connected === true;
  const hasRepos = linkedRepos.length > 0;

  const [addRepoOpen, setAddRepoOpen] = useState(false);

  const steps = [
    { num: 1, label: "Connect a Forgejo token", done: hasIntegration },
    { num: 2, label: "Link a repository", done: hasRepos },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-3 mb-1">
          <ForgejoIcon className="size-5 text-foreground/80" />
          <h3 className="font-[Syne] text-base font-semibold">
            Forgejo Integration
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Link Forgejo repositories to track pull requests, create branches from
          tasks, and receive webhook events automatically.
        </p>

        <div className="flex items-center gap-4 mb-6">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors",
                  step.done
                    ? "bg-emerald-500 text-white"
                    : "border-2 border-border text-muted-foreground/60",
                )}
              >
                {step.done ? <Check className="size-3.5" /> : step.num}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  step.done ? "text-foreground" : "text-muted-foreground/70",
                )}
              >
                {step.label}
              </span>
              {idx < steps.length - 1 && (
                <div className="h-px w-8 bg-border/60 shrink-0" />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="size-3.5 text-muted-foreground/70" />
            <label className="text-sm font-semibold text-foreground/80">
              Personal Access Token
            </label>
          </div>
          {integrationLoading ? (
            <Skeleton className="h-10 rounded-lg max-w-xs" />
          ) : (
            <TokenCard
              api={api}
              projectId={projectId}
              hasIntegration={hasIntegration}
              onTokenSet={() => setAddRepoOpen(true)}
              canEdit={canEdit}
            />
          )}
        </div>
      </div>

      {hasIntegration && (
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <GitPullRequest className="size-4 text-foreground/80" />
              <h3 className="font-[Syne] text-base font-semibold">
                Linked Repositories
              </h3>
              <button
                type="button"
                aria-label="Reload linked repositories"
                disabled={reposLoading}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors disabled:opacity-30"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: linkedReposKey(projectId),
                  })
                }
              >
                {reposLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
              </button>
            </div>
            {canEdit && (
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setAddRepoOpen(true)}
              >
                <Plus className="size-3.5" />
                Add repository
              </Btn>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {hasRepos
              ? "Webhooks are registered automatically for each linked repository."
              : "No repositories linked yet. Link a repository to track pull requests and branches."}
          </p>

          {reposLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-2">
              {linkedRepos.map((repo) => (
                <LinkedRepoItem
                  key={repo.id}
                  api={api}
                  projectId={projectId}
                  repo={repo}
                  canEdit={canEdit}
                />
              ))}

              {!hasRepos && (
                <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground/60">
                  <GitBranch className="size-8" />
                  <p className="text-sm">No repositories linked yet.</p>
                  {canEdit && (
                    <Btn
                      variant="outline"
                      size="sm"
                      onClick={() => setAddRepoOpen(true)}
                    >
                      <Plus className="size-3.5" />
                      Add your first repository
                    </Btn>
                  )}
                </div>
              )}
            </div>
          )}

          {canEdit && (
            <AddRepoDialog
              api={api}
              projectId={projectId}
              open={addRepoOpen}
              onOpenChange={setAddRepoOpen}
            />
          )}
        </div>
      )}

      {hasRepos && (
        <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 border border-border/40 px-4 py-3">
          <AlertCircle className="size-4 text-muted-foreground/70 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Webhooks are registered on all linked repositories. Forgejo will
            push <code className="font-mono">pull_request</code> events to keep
            PR status in sync automatically.
          </p>
        </div>
      )}

      {!hasIntegration && !integrationLoading && (
        <div className="flex items-start gap-2.5 rounded-lg bg-muted/30 border border-dashed border-border/50 px-4 py-3">
          <X className="size-4 text-muted-foreground/50 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            No Forgejo integration configured. Add a personal access token and
            instance URL to get started.
          </p>
        </div>
      )}
    </div>
  );
}

interface ForgejoSettingsTabProps {
  projectId: string;
  canEdit?: boolean;
}

export default function ForgejoSettingsTab({
  projectId,
  canEdit = true,
}: ForgejoSettingsTabProps) {
  const api = useMemo(
    () =>
      new PluginApiClient({
        baseUrl: `${window.location.origin}/api/v1`,
        projectId,
        fetch: (url, init) =>
          window.fetch(url, { ...init, credentials: "include" }),
      }),
    [projectId],
  );

  return (
    <PluginQueryClientProvider>
      <ForgejoSettingsInner api={api} projectId={projectId} canEdit={canEdit} />
    </PluginQueryClientProvider>
  );
}
