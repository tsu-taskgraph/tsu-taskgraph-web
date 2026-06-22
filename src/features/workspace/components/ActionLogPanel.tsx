import { useEffect } from 'react';
import {
    Activity,
    Bot,
    BookOpen,
    CheckCircle2,
    Clock,
    Cog,
    FolderPlus,
    GitBranch,
    GitPullRequest,
    History,
    Layout,
    Loader2,
    Pencil,
    PlusSquare,
    Shield,
    Sparkles,
    Trash2,
    User,
    UserPlus,
    Users,
    Wand2,
    X
} from 'lucide-react';
import type { ActionLogEntry, ActionLogEventType } from '../../../api/projects';

interface ActionLogPanelProps {
    projectId: string;
    isOpen: boolean;
    isClosing: boolean;
    onClose: () => void;
    actionLogs: ActionLogEntry[];
    loading: boolean;
    error: string | null;
    onReload: () => void;
}

const eventIconConfig: Record<ActionLogEventType, { icon: typeof Activity; className: string }> = {
    PROJECT_CREATED: { icon: FolderPlus, className: 'text-emerald-400 light:text-emerald-600' },
    PROJECT_UPDATED: { icon: Pencil, className: 'text-sky-400 light:text-sky-600' },
    MEMBER_INVITED: { icon: UserPlus, className: 'text-indigo-400 light:text-indigo-600' },
    MEMBER_ROLE_CHANGED: { icon: Shield, className: 'text-violet-400 light:text-violet-600' },
    MEMBER_REMOVED: { icon: User, className: 'text-rose-400 light:text-rose-600' },
    TASK_CREATED: { icon: PlusSquare, className: 'text-emerald-400 light:text-emerald-600' },
    TASK_UPDATED: { icon: Pencil, className: 'text-sky-400 light:text-sky-600' },
    TASK_STATUS_CHANGED: { icon: CheckCircle2, className: 'text-amber-400 light:text-amber-600' },
    TASK_ASSIGNED: { icon: Users, className: 'text-indigo-400 light:text-indigo-600' },
    TASK_UNASSIGNED: { icon: User, className: 'text-slate-400 light:text-slate-600' },
    TASK_DELETED: { icon: Trash2, className: 'text-rose-400 light:text-rose-600' },
    TIME_LOGGED: { icon: Clock, className: 'text-sky-400 light:text-sky-600' },
    EDGE_CREATED: { icon: GitBranch, className: 'text-purple-400 light:text-purple-600' },
    EDGE_DELETED: { icon: GitBranch, className: 'text-rose-400 light:text-rose-600' },
    GRAPH_MUTATED: { icon: Wand2, className: 'text-brand-400 light:text-brand-600' },
    SMART_RECOVERY_APPLIED: { icon: Sparkles, className: 'text-brand-400 light:text-brand-600' },
    AI_SKELETON_GENERATED: { icon: Sparkles, className: 'text-brand-400 light:text-brand-600' },
    AI_ENRICHMENT_COMPLETED: { icon: Sparkles, className: 'text-brand-400 light:text-brand-600' },
    WIKI_PAGE_CREATED: { icon: BookOpen, className: 'text-blue-400 light:text-blue-600' },
    WIKI_PAGE_UPDATED: { icon: BookOpen, className: 'text-sky-400 light:text-sky-600' },
    BLUEPRINT_GENERATED: { icon: Layout, className: 'text-fuchsia-400 light:text-fuchsia-600' },
    GITHUB_TASK_CLOSED: { icon: GitPullRequest, className: 'text-slate-400 light:text-slate-600' }
};

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
}

function getInitials(displayName: string) {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function ActorBadge({ actorType, actorDisplayName }: { actorType: ActionLogEntry['actorType']; actorDisplayName: string }) {
    if (actorType === 'AI') {
        return (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 light:text-brand-600">
                <Bot className="h-4 w-4" />
            </div>
        );
    }

    if (actorType === 'SYSTEM') {
        return (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-500/30 bg-slate-500/10 text-slate-400 light:text-slate-600">
                <Cog className="h-4 w-4" />
            </div>
        );
    }

    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 text-[10px] font-bold text-slate-200 light:border-slate-300 light:bg-slate-200 light:text-slate-700">
            {getInitials(actorDisplayName)}
        </div>
    );
}

export function ActionLogPanel({ projectId, isOpen, isClosing, onClose, actionLogs, loading, error, onReload }: ActionLogPanelProps) {
    useEffect(() => {
        if (isOpen && !isClosing && projectId && actionLogs.length === 0 && !loading && !error) {
            onReload();
        }
    }, [isOpen, isClosing, projectId, actionLogs.length, loading, error, onReload]);

    if (!isOpen) return null;

    return (
        <aside
            className={`fixed bottom-[154px] right-3 top-[104px] z-[55] flex w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#020617]/82 text-slate-100 shadow-2xl shadow-black/20 backdrop-blur-xl light:border-slate-200/70 light:bg-white/90 light:text-slate-900 light:shadow-slate-300/25 sm:right-4 lg:right-6 min-[2200px]:bottom-[88px] ${isClosing ? 'task-sidebar-exit' : 'task-sidebar-enter'}`}
        >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4 light:border-slate-200/70">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-950/45 text-brand-400 light:border-slate-200/60 light:bg-white/60 light:text-brand-600">
                        <History className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-white light:text-slate-900">Activity</h2>
                        <p className="text-xs text-slate-400 light:text-slate-600">Project action history</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/35 text-slate-400 transition hover:bg-slate-800/80 hover:text-white light:border-slate-200/70 light:bg-white/60 light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900"
                    aria-label="Close activity panel"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="workspace-sidebar-scroll min-h-0 flex-1 overflow-y-auto p-4 task-sidebar-content-enter">
                {loading && actionLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                        <span className="text-sm text-slate-400 light:text-slate-600">Loading activity...</span>
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center">
                        <p className="text-sm text-red-300 light:text-red-700">{error}</p>
                        <button
                            type="button"
                            onClick={onReload}
                            className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 light:text-red-700"
                        >
                            Retry
                        </button>
                    </div>
                ) : actionLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/35 text-slate-500 light:border-slate-200/60 light:bg-white/60">
                            <Activity className="h-7 w-7" />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-white light:text-slate-900">No activity yet</h3>
                        <p className="mt-1 max-w-[240px] text-xs text-slate-400 light:text-slate-600">Project events, task changes and AI actions will appear here.</p>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute left-4 top-3 bottom-3 w-px bg-white/10 light:bg-slate-200/60" />
                        <ul className="space-y-4">
                            {actionLogs.map((log) => {
                                const config = eventIconConfig[log.eventType] ?? { icon: Activity, className: 'text-slate-400 light:text-slate-600' };
                                const Icon = config.icon;
                                const isAutomated = log.actorType === 'AI' || log.actorType === 'SYSTEM';

                                return (
                                    <li key={log.id} className="relative pl-10">
                                        <div className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border bg-slate-950/70 light:bg-white/80 ${isAutomated ? 'border-brand-500/30' : 'border-slate-700 light:border-slate-300'}`}>
                                            <Icon className={`h-3.5 w-3.5 ${config.className}`} />
                                        </div>
                                        <div className={`rounded-2xl border p-3 transition ${isAutomated ? 'border-brand-500/10 bg-brand-500/[0.04] light:border-brand-500/10 light:bg-brand-50/40' : 'border-white/10 bg-slate-950/35 light:border-slate-200/70 light:bg-white/55'}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                    <ActorBadge actorType={log.actorType} actorDisplayName={log.actorDisplayName} />
                                                    <div>
                                                        <div className="text-xs font-semibold text-slate-200 light:text-slate-800">{log.actorDisplayName}</div>
                                                        <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{log.actorType}</div>
                                                    </div>
                                                </div>
                                                <span className="shrink-0 text-[10px] font-medium text-slate-500" title={formatDateTime(log.createdAt)}>
                                                    {formatRelativeTime(log.createdAt)}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-100 light:text-slate-900">{log.description}</p>
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div className="mt-2 rounded-xl border border-white/5 bg-white/[0.03] p-2 light:border-slate-200/40 light:bg-slate-100/50">
                                                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Details</p>
                                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                                        {Object.entries(log.metadata).map(([key, value]) => (
                                                            <span key={key} className="rounded-md border border-white/5 bg-slate-900/50 px-2 py-0.5 text-[10px] text-slate-400 light:border-slate-200/40 light:bg-white/60 light:text-slate-600">
                                                                {key}: {String(value)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </aside>
    );
}
