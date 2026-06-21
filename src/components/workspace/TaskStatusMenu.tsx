import { useCallback, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Hourglass, Play, SkipForward } from 'lucide-react';
import type { TaskNode } from '../../api/projects';

type StatusAction = Extract<TaskNode['status'], 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'>;

interface TaskStatusMenuProps {
    task: TaskNode;
    screen: { x: number; y: number };
    onClose: () => void;
    onStatusChange: (status: StatusAction, data?: { loggedHours?: number | null; comment?: string | null; completionPercent?: number | null }) => Promise<void>;
    onLogTime: (data: { hours?: number | null; comment?: string | null; completionPercent?: number | null }) => Promise<void>;
    updating: boolean;
}

const actionConfig: Array<{
    status: StatusAction;
    label: string;
    icon: typeof Play;
    activeClass: string;
    inactiveClass: string;
}> = [
    {
        status: 'IN_PROGRESS',
        label: 'Start',
        icon: Play,
        activeClass: 'border-sky-500 bg-sky-500/25 text-sky-200 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30 light:bg-sky-500/20 light:text-sky-800 light:border-sky-500',
        inactiveClass: 'border-sky-500/25 bg-sky-500/5 text-sky-400 hover:bg-sky-500/10 light:bg-sky-500/5 light:text-sky-700 light:border-sky-500/20'
    },
    {
        status: 'COMPLETED',
        label: 'Complete',
        icon: CheckCircle2,
        activeClass: 'border-emerald-500 bg-emerald-500/25 text-emerald-200 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30 light:bg-emerald-50/20 light:text-emerald-800 light:border-emerald-500',
        inactiveClass: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 light:bg-emerald-500/5 light:text-emerald-700 light:border-emerald-500/20'
    },
    {
        status: 'SKIPPED',
        label: 'Skip',
        icon: SkipForward,
        activeClass: 'border-violet-500 bg-violet-500/25 text-violet-200 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30 light:bg-violet-50/20 light:text-violet-800 light:border-violet-500',
        inactiveClass: 'border-violet-500/25 bg-violet-500/5 text-violet-400 hover:bg-violet-500/10 light:bg-violet-500/5 light:text-violet-700 light:border-violet-500/20'
    }
];

const fieldClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-brand-500 light:focus:ring-brand-500';

export function TaskStatusMenu({ task, screen, onStatusChange, onLogTime, updating }: TaskStatusMenuProps) {
    const [selectedStatus, setSelectedStatus] = useState<TaskNode['status']>(task.status);
    const [loggedHours, setLoggedHours] = useState('0.0');
    const [progress, setProgress] = useState(String(task.completionPercent ?? 0));
    const [comment, setComment] = useState('');
    const [progressDropdownOpen, setProgressDropdownOpen] = useState(false);
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

    const currentHoursValue = currentHours();
    const currentProgressValue = currentProgress();
    const hasChanges = selectedStatus !== task.status ||
        (currentHoursValue !== null && currentHoursValue > 0) ||
        currentProgressValue !== task.completionPercent;

    const handleSave = () => {
        if (!hasChanges) return;
        const hours = currentHoursValue;
        const completionPercent = currentProgressValue;

        if (selectedStatus !== task.status) {
            if (selectedStatus === 'IN_PROGRESS' || selectedStatus === 'COMPLETED' || selectedStatus === 'SKIPPED') {
                void onStatusChange(selectedStatus, {
                    loggedHours: hours,
                    comment: comment.trim() || null,
                    completionPercent
                });
            }
        } else {
            void onLogTime({
                hours,
                comment: comment.trim() || null,
                completionPercent
            });
        }
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
                <p className="mt-2 text-xs leading-relaxed text-slate-400 light:text-slate-600">Change lifecycle status, log time, or update progress.</p>
            </div>

            {disabledReason && (
                <div className="mb-3 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-200 light:text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{disabledReason}</span>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2">
                {actionConfig.map(({ status, label, icon: Icon, activeClass, inactiveClass }) => {
                    const isSelected = selectedStatus === status;
                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => {
                                if (isSelected) {
                                    setSelectedStatus(task.status);
                                } else {
                                    setSelectedStatus(status);
                                }
                            }}
                            disabled={updating || Boolean(disabledReason)}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-bold transition duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? activeClass : inactiveClass}`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    );
                })}
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
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <span>Progress</span>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setProgressDropdownOpen((open) => !open)}
                            disabled={updating || task.status === 'LOCKED'}
                            className="flex items-center justify-between gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-right text-xs font-bold text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>{progress}%</span>
                            <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${progressDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {progressDropdownOpen && (
                            <div className="absolute right-0 top-full z-[95] mt-2 max-h-48 w-24 origin-top overflow-y-auto rounded-xl border border-white/10 bg-slate-950/90 p-1 shadow-xl backdrop-blur-xl animate-dropdown-slide light:border-slate-200/80 light:bg-white/95">
                                {Array.from({ length: 11 }, (_, i) => i * 10).map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            setProgress(String(val));
                                            setProgressDropdownOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${String(val) === progress ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white light:text-slate-700 light:hover:bg-slate-50 light:hover:text-slate-950'}`}
                                    >
                                        {val}%
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={handleSave}
                disabled={updating || task.status === 'LOCKED' || !hasChanges}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-brand-500 to-orange-500 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition duration-300 hover:shadow-brand-500/35 disabled:cursor-not-allowed disabled:from-brand-500/10 disabled:to-brand-500/10 disabled:border disabled:border-brand-500/20 disabled:text-brand-300/50 disabled:shadow-none"
            >
                {updating ? 'Saving...' : 'Save changes'}
            </button>

            {updating && <p className="mt-2 text-xs font-medium text-slate-400 light:text-slate-500">Updating task...</p>}
        </div>
    );
}
