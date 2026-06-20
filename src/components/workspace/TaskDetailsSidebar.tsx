import { useMemo, useState } from 'react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    CircleDashed,
    Clock,
    ExternalLink,
    Hourglass,
    Lock,
    Play,
    SkipForward,
    Tag,
    UserRound,
    X,
    Zap
} from 'lucide-react';
import type { TaskNode } from '../../api/projects';

type TaskStatus = TaskNode['status'];
type TaskCategory = NonNullable<TaskNode['category']>;

type StatusAction = Extract<TaskStatus, 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'>;

interface TaskDetailsSidebarProps {
    task: TaskNode;
    onClose: () => void;
    onStatusChange: (status: StatusAction, data?: { loggedHours?: number | null; comment?: string | null }) => Promise<void>;
    updating: boolean;
}

const statusMeta: Record<TaskStatus, {
    label: string;
    icon: typeof Lock;
    className: string;
    description: string;
}> = {
    LOCKED: {
        label: 'Locked',
        icon: Lock,
        className: 'border-slate-500/20 bg-slate-500/10 text-slate-400 light:bg-slate-100 light:text-slate-600 light:border-slate-200',
        description: 'Waiting for dependencies to be completed.'
    },
    AVAILABLE: {
        label: 'Available',
        icon: Zap,
        className: 'border-amber-500/25 bg-amber-500/10 text-amber-300 light:bg-amber-500/15 light:text-amber-700 light:border-amber-500/30',
        description: 'Ready to be started.'
    },
    IN_PROGRESS: {
        label: 'In progress',
        icon: Hourglass,
        className: 'border-sky-500/25 bg-sky-500/10 text-sky-300 light:bg-sky-500/15 light:text-sky-700 light:border-sky-500/30',
        description: 'Work is currently in progress.'
    },
    COMPLETED: {
        label: 'Completed',
        icon: CheckCircle2,
        className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 light:bg-emerald-500/15 light:text-emerald-700 light:border-emerald-500/30',
        description: 'Task has been completed.'
    },
    SKIPPED: {
        label: 'Skipped',
        icon: CircleDashed,
        className: 'border-violet-500/25 bg-violet-500/10 text-violet-300 light:bg-violet-500/15 light:text-violet-700 light:border-violet-500/30',
        description: 'Task was intentionally skipped.'
    }
};

const categoryClass: Record<TaskCategory, string> = {
    BACKEND: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 light:bg-indigo-500/10 light:text-indigo-700 light:border-indigo-500/20',
    FRONTEND: 'bg-pink-500/10 text-pink-300 border-pink-500/20 light:bg-pink-500/10 light:text-pink-700 light:border-pink-500/20',
    DEVOPS: 'bg-orange-500/10 text-orange-300 border-orange-500/20 light:bg-orange-500/10 light:text-orange-700 light:border-orange-500/20',
    TESTING: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 light:bg-emerald-500/10 light:text-emerald-700 light:border-emerald-500/20',
    DOCUMENTATION: 'bg-blue-500/10 text-blue-300 border-blue-500/20 light:bg-blue-500/10 light:text-blue-700 light:border-blue-500/20',
    DESIGN: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20 light:bg-fuchsia-500/10 light:text-fuchsia-700 light:border-fuchsia-500/20',
    OTHER: 'bg-slate-500/10 text-slate-300 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200'
};

function formatDate(value: string | null) {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatHours(value: number | null | undefined) {
    return `${value ?? 0}h`;
}

export function TaskDetailsSidebar({ task, onClose, onStatusChange, updating }: TaskDetailsSidebarProps) {
    const [loggedHours, setLoggedHours] = useState(() => String(task.loggedHours ?? 0));
    const [comment, setComment] = useState('');
    const status = statusMeta[task.status];
    const StatusIcon = status.icon;
    const category = task.category ?? 'OTHER';
    const assignees = task.assignees ?? [];
    const checklist = task.enrichment?.checklist ?? [];
    const pitfalls = task.enrichment?.pitfalls ?? [];
    const links = task.enrichment?.links ?? [];
    const hasEnrichmentDetails = checklist.length > 0 || pitfalls.length > 0 || links.length > 0;
    const progress = typeof task.completionPercent === 'number'
        ? task.completionPercent
        : task.status === 'COMPLETED'
            ? 100
            : task.status === 'IN_PROGRESS'
                ? 50
                : 0;

    const actionDisabledReason = useMemo(() => {
        if (task.status === 'LOCKED') return 'Locked tasks cannot be changed until dependencies are completed.';
        if (task.status === 'COMPLETED') return 'Completed tasks are already closed.';
        return null;
    }, [task.status]);

    const normalizedLoggedHours = () => {
        const parsed = Number(loggedHours.replace(',', '.'));
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    };

    const handleAction = (nextStatus: StatusAction) => {
        void onStatusChange(nextStatus, {
            loggedHours: nextStatus === 'COMPLETED' ? normalizedLoggedHours() : null,
            comment: comment.trim() || null
        });
    };

    return (
        <aside className="fixed right-3 top-[104px] z-[65] flex max-h-[calc(100dvh-128px)] w-[min(390px,calc(100vw-1.5rem))] animate-slide-left-fade flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#020617]/82 text-slate-100 shadow-2xl shadow-black/20 backdrop-blur-2xl light:border-slate-200/70 light:bg-white/90 light:text-slate-900 light:shadow-slate-300/25 sm:right-4 lg:right-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 light:border-slate-200/70">
                <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${categoryClass[category]}`}>
                            <Tag className="h-3.5 w-3.5" />
                            {category}
                        </span>
                    </div>
                    <h2 className="line-clamp-3 text-lg font-extrabold leading-tight tracking-tight text-white light:text-slate-950">
                        {task.title}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400 light:text-slate-600">{status.description}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/35 text-slate-400 transition hover:bg-slate-800/80 hover:text-white light:border-slate-200/70 light:bg-white/60 light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900"
                    aria-label="Close task details"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
                <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400 light:text-slate-500">
                        <span>Progress</span>
                        <span className="font-bold text-slate-100 light:text-slate-900">{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.07] light:bg-slate-200/70">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </section>

                <section className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            <Clock className="h-3.5 w-3.5" /> Estimate
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-100 light:text-slate-900">{formatHours(task.estimatedHours)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            <Clock className="h-3.5 w-3.5" /> Logged
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-100 light:text-slate-900">{formatHours(task.loggedHours)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" /> Start
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-100 light:text-slate-900">{formatDate(task.startDate)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" /> Due
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-100 light:text-slate-900">{formatDate(task.dueDate)}</div>
                    </div>
                </section>

                <section className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</h3>
                    <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-sm leading-relaxed text-slate-300 light:border-slate-200/70 light:bg-white/55 light:text-slate-700">
                        {task.description?.trim() || 'No description provided.'}
                    </p>
                </section>

                <section className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Assignees</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {assignees.length > 0 ? assignees.map((assignee) => (
                            <div key={assignee.userId} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs font-semibold text-slate-300 light:border-slate-200/70 light:bg-white/55 light:text-slate-700">
                                <UserRound className="h-3.5 w-3.5 text-brand-400 light:text-brand-600" />
                                {assignee.displayName}
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500">No assignees.</p>
                        )}
                    </div>
                </section>

                {hasEnrichmentDetails && (
                    <section className="mt-4 space-y-3">
                        {checklist.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Checklist</h3>
                                <ul className="mt-2 space-y-1.5 rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                                    {checklist.map((item, index) => (
                                        <li key={`${item}-${index}`} className="flex gap-2 text-sm text-slate-300 light:text-slate-700">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400 light:text-emerald-600" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {pitfalls.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Pitfalls</h3>
                                <ul className="mt-2 space-y-1.5 rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                                    {pitfalls.map((item, index) => (
                                        <li key={`${item}-${index}`} className="flex gap-2 text-sm text-slate-300 light:text-slate-700">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 light:text-amber-600" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {links.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Links</h3>
                                <div className="mt-2 space-y-1.5">
                                    {links.map((link, index) => (
                                        <a
                                            key={`${link.url}-${index}`}
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm font-semibold text-brand-300 transition hover:bg-white/5 hover:text-brand-200 light:border-slate-200/70 light:bg-white/55 light:text-brand-700 light:hover:bg-slate-50"
                                        >
                                            <span className="line-clamp-1">{link.title}</span>
                                            <ExternalLink className="h-4 w-4 shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                <section className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Change status</h3>
                    {actionDisabledReason && (
                        <div className="mt-2 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-200 light:text-amber-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{actionDisabledReason}</span>
                        </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button
                            type="button"
                            onClick={() => handleAction('IN_PROGRESS')}
                            disabled={updating || Boolean(actionDisabledReason) || task.status === 'IN_PROGRESS'}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-300 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50 light:text-sky-700"
                        >
                            <Play className="h-4 w-4" /> Start
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction('COMPLETED')}
                            disabled={updating || Boolean(actionDisabledReason)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 light:text-emerald-700"
                        >
                            <CheckCircle2 className="h-4 w-4" /> Complete
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction('SKIPPED')}
                            disabled={updating || Boolean(actionDisabledReason) || task.status === 'SKIPPED'}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-300 transition hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50 light:text-violet-700"
                        >
                            <SkipForward className="h-4 w-4" /> Skip
                        </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Logged hours</label>
                            <input
                                value={loggedHours}
                                onChange={(event) => setLoggedHours(event.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))}
                                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-100 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900"
                                disabled={updating || task.status === 'LOCKED'}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Comment</label>
                            <input
                                value={comment}
                                onChange={(event) => setComment(event.target.value)}
                                placeholder="Optional"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900 light:placeholder:text-slate-400"
                                disabled={updating || task.status === 'LOCKED'}
                            />
                        </div>
                    </div>

                    {updating && (
                        <p className="mt-2 text-xs font-medium text-slate-400 light:text-slate-500">Updating task status...</p>
                    )}
                </section>
            </div>
        </aside>
    );
}
