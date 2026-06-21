import { useCallback, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Hourglass, Play, SkipForward } from 'lucide-react';
import type { TaskNode } from '../../api/projects';

type StatusAction = Extract<TaskNode['status'], 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'>;

interface TaskStatusMenuProps {
    task: TaskNode;
    screen: { x: number; y: number };
    onClose: () => void;
    onStatusChange: (status: StatusAction, data?: { loggedHours?: number | null; comment?: string | null; completionPercent?: number | null }) => Promise<void>;
    onLogTime: (data: { hours: number; comment?: string | null; completionPercent?: number | null }) => Promise<void>;
    updating: boolean;
}

const actionConfig: Array<{
    status: StatusAction;
    label: string;
    icon: typeof Play;
    className: string;
}> = [
        { status: 'IN_PROGRESS', label: 'Start', icon: Play, className: 'border-sky-500/25 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15 light:text-sky-700' },
        { status: 'COMPLETED', label: 'Complete', icon: CheckCircle2, className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 light:text-emerald-700' },
        { status: 'SKIPPED', label: 'Skip', icon: SkipForward, className: 'border-violet-500/25 bg-violet-500/10 text-violet-300 hover:bg-violet-500/15 light:text-violet-700' }
    ];

const fieldClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-brand-500 light:focus:ring-brand-500';

export function TaskStatusMenu({ task, screen, onStatusChange, onLogTime, updating }: TaskStatusMenuProps) {
    const [loggedHours, setLoggedHours] = useState('0.0');
    const [progress, setProgress] = useState(String(task.completionPercent ?? 0));
    const [comment, setComment] = useState('');
    const disabledReason = task.status === 'LOCKED'
        ? 'Locked tasks cannot be changed until dependencies are completed.'
        : null;

    const parseHoursValue = useCallback((value: string): number | null => {
        const normalized = value.trim().replace(',', '.');
        if (!normalized) return null;
        if (normalized.includes(':')) {
            const [hoursPart, minutesPart = '0'] = normalized.split(':');
            const hours = Number(hoursPart || 0);
            const minutes = Number(minutesPart || 0);
            if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || minutes < 0 || minutes >= 60) return Number.NaN;
            return hours + minutes / 60;
        }
        return Number(normalized);
    }, []);

    const formatDecimalHours = useCallback((hours: number) => {
        if (!Number.isFinite(hours) || hours < 0) return '0.0';
        const fixed = hours.toFixed(2);
        const trimmed = fixed.replace(/0$/, '');
        return trimmed.includes('.') ? trimmed : `${trimmed}.0`;
    }, []);

    const formatHoursValue = useCallback((value: string) => {
        const normalized = value.trim().replace(',', '.');
        if (!normalized) return '0.0';
        if (normalized.includes(':')) {
            const [rawHours = '0', rawMinutes = '0'] = normalized.split(':');
            const hours = Number(rawHours || 0);
            const minutes = Number(rawMinutes || 0);
            if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || minutes < 0 || minutes >= 60) return '0.0';
            return `${Math.floor(hours)}:${String(Math.floor(minutes)).padStart(2, '0')}`;
        }
        return formatDecimalHours(Number(normalized));
    }, [formatDecimalHours]);

    const maskHoursValue = useCallback((value: string) => {
        const normalized = value.replace(',', '.');
        if (normalized.includes(':')) {
            const [rawHours = '', rawMinutes = ''] = normalized.split(':');
            const hours = rawHours.replace(/\D/g, '').slice(0, 4);
            const minutes = rawMinutes.replace(/\D/g, '').slice(0, 2);
            return `${hours || '0'}:${minutes}`;
        }
        const cleaned = normalized.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        const [rawInteger = '', rawDecimal] = cleaned.split('.');
        const integerPart = rawInteger.replace(/^0+(?=\d)/, '') || '0';
        return rawDecimal !== undefined ? `${integerPart}.${rawDecimal.slice(0, 2)}` : integerPart;
    }, []);

    const updateHoursByStep = useCallback((direction: 1 | -1) => {
        setLoggedHours((current) => {
            const parsed = parseHoursValue(current);
            const next = Math.max(0, (parsed !== null && Number.isFinite(parsed) ? parsed : 0) + direction * 0.25);
            return formatDecimalHours(next);
        });
    }, [formatDecimalHours, parseHoursValue]);

    const currentHours = () => {
        const parsed = parseHoursValue(loggedHours);
        return parsed !== null && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };

    const currentProgress = () => {
        const parsed = Number(progress);
        return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : null;
    };

    const submitStatus = (status: StatusAction) => {
        void onStatusChange(status, {
            loggedHours: status === 'COMPLETED' ? currentHours() : null,
            comment: comment.trim() || null,
            completionPercent: currentProgress()
        });
    };

    const submitTime = () => {
        const hours = currentHours();
        if (!hours) return;
        void onLogTime({ hours, comment: comment.trim() || null, completionPercent: currentProgress() });
    };

    return (
        <div
            className="fixed z-[75] w-[min(340px,calc(100vw-1.5rem))] animate-zoom-in-fade rounded-3xl border border-white/10 bg-[#020617]/88 p-4 text-slate-100 shadow-2xl shadow-black/25 backdrop-blur-2xl light:border-slate-200/70 light:bg-white/95 light:text-slate-900 light:shadow-slate-300/25"
            style={{ left: Math.min(Math.max(screen.x, 12), window.innerWidth - 352), top: Math.min(Math.max(screen.y, 96), window.innerHeight - 330) }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
        >
            <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-300 light:text-brand-700">
                    <Hourglass className="h-3 w-3" />
                    Task actions
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400 light:text-slate-600">Change lifecycle status or log time without changing status.</p>
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
                        onClick={() => submitStatus(status)}
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
                    <div className="relative">
                        <input
                            type="text"
                            inputMode="text"
                            value={loggedHours}
                            placeholder="1.5 or 1:30"
                            onChange={(event) => setLoggedHours(maskHoursValue(event.target.value))}
                            onFocus={(event) => event.target.select()}
                            onBlur={() => setLoggedHours((current) => formatHoursValue(current))}
                            className={`${fieldClass} pr-9 font-semibold tabular-nums`}
                            disabled={updating || task.status === 'LOCKED'}
                        />
                        <div className="absolute inset-y-1.5 right-1.5 flex w-6 flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-900/70 light:border-slate-200/80 light:bg-slate-50">
                            <button type="button" onClick={() => updateHoursByStep(1)} disabled={updating || task.status === 'LOCKED'} className="flex flex-1 items-center justify-center text-slate-400 transition hover:bg-white/5 hover:text-brand-300 disabled:opacity-50 light:text-slate-500 light:hover:bg-white light:hover:text-brand-600" aria-label="Increase logged hours"><ChevronUp className="h-3 w-3" /></button>
                            <div className="h-px bg-white/10 light:bg-slate-200" />
                            <button type="button" onClick={() => updateHoursByStep(-1)} disabled={updating || task.status === 'LOCKED'} className="flex flex-1 items-center justify-center text-slate-400 transition hover:bg-white/5 hover:text-brand-300 disabled:opacity-50 light:text-slate-500 light:hover:bg-white light:hover:text-brand-600" aria-label="Decrease logged hours"><ChevronDown className="h-3 w-3" /></button>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Comment</label>
                    <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Optional" className={fieldClass} disabled={updating || task.status === 'LOCKED'} />
                </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <span>Progress</span>
                    <input
                        value={progress}
                        onChange={(event) => setProgress(event.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                        onBlur={() => setProgress((current) => String(Math.min(100, Math.max(0, Number(current) || 0))))}
                        className="w-16 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-right text-xs font-bold text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900"
                        disabled={updating || task.status === 'LOCKED'}
                    />
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.min(100, Math.max(0, Number(progress) || 0))}
                    onChange={(event) => setProgress(event.target.value)}
                    className="w-full accent-brand-500"
                    disabled={updating || task.status === 'LOCKED'}
                />
            </div>

            <button
                type="button"
                onClick={submitTime}
                disabled={updating || task.status === 'LOCKED' || !currentHours()}
                className="mt-3 w-full rounded-xl border border-brand-500/25 bg-brand-500/10 px-3 py-2 text-xs font-bold text-brand-300 transition hover:bg-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50 light:text-brand-700"
            >
                Log time
            </button>

            {updating && <p className="mt-2 text-xs font-medium text-slate-400 light:text-slate-500">Updating task...</p>}
        </div>
    );
}
