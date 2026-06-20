import { useState } from 'react';
import { AlertCircle, CheckCircle2, Hourglass, Play, SkipForward, X } from 'lucide-react';
import type { TaskNode } from '../../api/projects';

type StatusAction = Extract<TaskNode['status'], 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'>;

interface TaskStatusMenuProps {
    task: TaskNode;
    screen: { x: number; y: number };
    onClose: () => void;
    onStatusChange: (status: StatusAction, data?: { loggedHours?: number | null; comment?: string | null }) => Promise<void>;
    updating: boolean;
}

const actionConfig: Array<{
    status: StatusAction;
    label: string;
    icon: typeof Play;
    className: string;
}> = [
        {
            status: 'IN_PROGRESS',
            label: 'Start',
            icon: Play,
            className: 'border-sky-500/25 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15 light:text-sky-700'
        },
        {
            status: 'COMPLETED',
            label: 'Complete',
            icon: CheckCircle2,
            className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 light:text-emerald-700'
        },
        {
            status: 'SKIPPED',
            label: 'Skip',
            icon: SkipForward,
            className: 'border-violet-500/25 bg-violet-500/10 text-violet-300 hover:bg-violet-500/15 light:text-violet-700'
        }
    ];

export function TaskStatusMenu({ task, screen, onClose, onStatusChange, updating }: TaskStatusMenuProps) {
    const [loggedHours, setLoggedHours] = useState(() => String(task.loggedHours ?? 0));
    const [comment, setComment] = useState('');
    const disabledReason = task.status === 'LOCKED'
        ? 'Locked tasks cannot be changed until dependencies are completed.'
        : task.status === 'COMPLETED'
            ? 'Completed tasks are already closed.'
            : null;

    const normalizeHours = () => {
        const parsed = Number(loggedHours.replace(',', '.'));
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    };

    const submit = (status: StatusAction) => {
        void onStatusChange(status, {
            loggedHours: status === 'COMPLETED' ? normalizeHours() : null,
            comment: comment.trim() || null
        });
    };

    return (
        <div
            className="fixed z-[75] w-[min(340px,calc(100vw-1.5rem))] animate-zoom-in-fade rounded-3xl border border-white/10 bg-[#020617]/88 p-4 text-slate-100 shadow-2xl shadow-black/25 backdrop-blur-2xl light:border-slate-200/70 light:bg-white/95 light:text-slate-900 light:shadow-slate-300/25"
            style={{
                left: Math.min(Math.max(screen.x, 12), window.innerWidth - 352),
                top: Math.min(Math.max(screen.y, 96), window.innerHeight - 360)
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-300 light:text-brand-700">
                        <Hourglass className="h-3 w-3" />
                        Change status
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-snug text-white light:text-slate-950">{task.title}</h3>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/35 text-slate-400 transition hover:bg-slate-800/80 hover:text-white light:border-slate-200/70 light:bg-white/60 light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900"
                    aria-label="Close status menu"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {disabledReason && (
                <div className="mb-3 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-200 light:text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{disabledReason}</span>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2">
                {actionConfig.map(({ status, label, icon: Icon, className }) => (
                    <button
                        key={status}
                        type="button"
                        onClick={() => submit(status)}
                        disabled={updating || Boolean(disabledReason) || task.status === status}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
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

            {updating && <p className="mt-2 text-xs font-medium text-slate-400 light:text-slate-500">Updating task status...</p>}
        </div>
    );
}
