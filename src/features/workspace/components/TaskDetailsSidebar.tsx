import { useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    CircleDashed,
    Clock,
    ExternalLink,
    Hourglass,
    Loader2,
    Lock,
    Pencil,
    Save,
    Tag,
    Trash2,
    X,
    Zap
} from 'lucide-react';
import { projectsApi, type TaskNode, type ProjectMember, type TimeLogResponse } from '../../../api/projects';

type TaskStatus = TaskNode['status'];
type TaskCategory = NonNullable<TaskNode['category']>;

interface TaskDetailsSidebarProps {
    task: TaskNode;
    members: ProjectMember[];
    currentUserId?: string;
    onClose: () => void;
    onTaskUpdate: (data: {
        title?: string;
        description?: string | null;
        category?: TaskNode['category'];
        estimatedHours?: number | null;
        completionPercent?: number | null;
        status?: TaskNode['status'];
        startDate?: string | null;
        dueDate?: string | null;
    }) => Promise<void>;
    onAssigneesChange: (userIds: string[]) => Promise<void>;
    onTimeLogDelete: (log: TimeLogResponse) => Promise<void>;
    onInteract?: () => void;
    updating: boolean;
    isClosing?: boolean;
    isEnriching?: boolean;
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

const taskCategories: TaskCategory[] = ['BACKEND', 'FRONTEND', 'DEVOPS', 'TESTING', 'DOCUMENTATION', 'DESIGN', 'OTHER'];

const categoryClass: Record<TaskCategory, string> = {
    BACKEND: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 light:bg-indigo-500/10 light:text-indigo-700 light:border-indigo-500/20',
    FRONTEND: 'bg-pink-500/10 text-pink-300 border-pink-500/20 light:bg-pink-500/10 light:text-pink-700 light:border-pink-500/20',
    DEVOPS: 'bg-orange-500/10 text-orange-300 border-orange-500/20 light:bg-orange-500/10 light:text-orange-700 light:border-orange-500/20',
    TESTING: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 light:bg-emerald-500/10 light:text-emerald-700 light:border-emerald-500/20',
    DOCUMENTATION: 'bg-blue-500/10 text-blue-300 border-blue-500/20 light:bg-blue-500/10 light:text-blue-700 light:border-blue-500/20',
    DESIGN: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20 light:bg-fuchsia-500/10 light:text-fuchsia-700 light:border-fuchsia-500/20',
    OTHER: 'bg-slate-500/10 text-slate-300 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200'
};

const fieldClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-100 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900';

function formatDate(value: string | null) {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatHours(value: number | null | undefined) {
    return `${value ?? 0}h`;
}

function getInitials(displayName: string) {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

function CustomDateField({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const selectedDate = parseDateValue(value);
    const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days = Array.from({ length: offset + daysInMonth }, (_, index) => index < offset ? null : index - offset + 1);

    const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

    const currentYear = new Date().getFullYear();
    const yearsRange = Array.from({ length: 21 }, (_, index) => currentYear - 10 + index);

    return (
        <div className="relative mt-1">
            <button
                type="button"
                onClick={() => {
                    setOpen((current) => !current);
                    setMonthDropdownOpen(false);
                    setYearDropdownOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-left text-sm font-bold text-slate-100 transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900"
                aria-label={`Select ${label.toLowerCase()} date`}
            >
                <span className="truncate">{selectedDate ? formatDate(value) : 'Not set'}</span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className={`absolute top-[calc(100%+0.5rem)] z-[90] w-[272px] max-w-[calc(100vw-2rem)] origin-top rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-xl shadow-black/25 backdrop-blur-xl animate-dropdown-slide light:border-slate-200/80 light:bg-white/95 light:shadow-slate-300/25 ${label === 'Start' ? 'left-0' : 'right-0'}`}>
                    <div className="mb-3 flex justify-center items-center gap-2">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setMonthDropdownOpen((current) => !current);
                                    setYearDropdownOpen(false);
                                }}
                                className="flex min-w-[90px] items-center justify-between gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-100 transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900"
                            >
                                <span className="truncate">{monthNames[month]}</span>
                                <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${monthDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {monthDropdownOpen && (
                                <div className="absolute left-0 top-[calc(100%+0.25rem)] z-[95] max-h-48 w-32 origin-top overflow-y-auto rounded-xl border border-white/10 bg-slate-950/90 p-1 shadow-lg backdrop-blur-xl animate-dropdown-slide light:border-slate-200/80 light:bg-white/95">
                                    {monthNames.map((name, index) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => {
                                                setViewDate(new Date(year, index, 1));
                                                setMonthDropdownOpen(false);
                                            }}
                                            className={`flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${index === month ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white light:text-slate-700 light:hover:bg-slate-50 light:hover:text-slate-950'}`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setYearDropdownOpen((current) => !current);
                                    setMonthDropdownOpen(false);
                                }}
                                className="flex min-w-[70px] items-center justify-between gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-100 transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900"
                            >
                                <span>{year}</span>
                                <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {yearDropdownOpen && (
                                <div className="absolute right-0 top-[calc(100%+0.25rem)] z-[95] max-h-48 w-24 origin-top overflow-y-auto rounded-xl border border-white/10 bg-slate-950/90 p-1 shadow-lg backdrop-blur-xl animate-dropdown-slide light:border-slate-200/80 light:bg-white/95">
                                    {yearsRange.map((y) => (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() => {
                                                setViewDate(new Date(y, month, 1));
                                                setYearDropdownOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${y === year ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white light:text-slate-700 light:hover:bg-slate-50 light:hover:text-slate-950'}`}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
                        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => <span key={day} className="flex h-6 items-center justify-center">{day}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                            const active = Boolean(day && selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day);
                            return day ? (
                                <button
                                    key={`${day}-${index}`}
                                    type="button"
                                    onClick={() => { onChange(toDateInputValue(new Date(year, month, day))); setOpen(false); }}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${active ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-slate-300 hover:bg-white/5 hover:text-white light:text-slate-700 light:hover:bg-slate-50 light:hover:text-slate-950'}`}
                                >
                                    {day}
                                </button>
                            ) : <span key={`empty-${index}`} className="h-8 w-8" />;
                        })}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                        <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-200 light:hover:bg-slate-50 light:hover:text-slate-900">Clear</button>
                        <button type="button" onClick={() => { const today = new Date(); setViewDate(today); onChange(toDateInputValue(today)); setOpen(false); }} className="rounded-lg px-2 py-1.5 text-xs font-bold text-brand-300 transition hover:bg-brand-500/10 light:text-brand-700">Today</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function TaskDetailsSidebar({ task, members, currentUserId, onClose, onTaskUpdate, onAssigneesChange, onTimeLogDelete, onInteract, updating, isClosing = false, isEnriching = false }: TaskDetailsSidebarProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftTitle, setDraftTitle] = useState(task.title);
    const [draftDescription, setDraftDescription] = useState(task.description ?? '');
    const [draftCategory, setDraftCategory] = useState<TaskCategory>(task.category ?? 'OTHER');
    const [draftEstimate, setDraftEstimate] = useState(String(task.estimatedHours ?? 0));
    const [draftProgress, setDraftProgress] = useState(String(task.completionPercent ?? 0));
    const [draftStartDate, setDraftStartDate] = useState(task.startDate ?? '');
    const [draftDueDate, setDraftDueDate] = useState(task.dueDate ?? '');
    const [draftStatus, setDraftStatus] = useState<TaskStatus>(task.status);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [progressDropdownOpen, setProgressDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [assigneesDropdownOpen, setAssigneesDropdownOpen] = useState(false);
    const [assigneeUpdating, setAssigneeUpdating] = useState(false);
    const [timeLogs, setTimeLogs] = useState<TimeLogResponse[]>([]);
    const [timeLogsLoading, setTimeLogsLoading] = useState(false);
    const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
    const titleRef = useRef<HTMLHeadingElement | null>(null);

    const status = statusMeta[task.status];
    const StatusIcon = status.icon;
    const category = task.category ?? 'OTHER';
    const assignees = task.assignees ?? [];
    const checklist = task.enrichment?.checklist ?? [];
    const pitfalls = task.enrichment?.pitfalls ?? [];
    const links = task.enrichment?.links ?? [];
    const hasEnrichmentDetails = checklist.length > 0 || pitfalls.length > 0 || links.length > 0;
    const progress = typeof task.completionPercent === 'number' ? task.completionPercent : 0;

    useEffect(() => {
        setDraftTitle(task.title);
        setDraftDescription(task.description ?? '');
        setDraftCategory(task.category ?? 'OTHER');
        setDraftEstimate(String(task.estimatedHours ?? 0));
        setDraftProgress(String(task.completionPercent ?? 0));
        setDraftStartDate(task.startDate ?? '');
        setDraftDueDate(task.dueDate ?? '');
        setDraftStatus(task.status);
        setIsEditing(false);
        setCategoryDropdownOpen(false);
        setProgressDropdownOpen(false);
        setStatusDropdownOpen(false);
        setAssigneesDropdownOpen(false);
        setTimeLogs([]);
    }, [task.id, task.title, task.description, task.category, task.estimatedHours, task.completionPercent, task.startDate, task.dueDate, task.status]);

    useEffect(() => {
        let cancelled = false;
        setTimeLogsLoading(true);
        void projectsApi.listTaskTimeLogs(task.id).then((logs) => {
            if (!cancelled) {
                setTimeLogs(logs);
            }
        }).finally(() => {
            if (!cancelled) {
                setTimeLogsLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [task.id, task.loggedHours]);

    const startEditing = () => setIsEditing(true);
    const cancelEditing = () => {
        setDraftTitle(task.title);
        setDraftDescription(task.description ?? '');
        setDraftCategory(task.category ?? 'OTHER');
        setDraftEstimate(String(task.estimatedHours ?? 0));
        setDraftProgress(String(task.completionPercent ?? 0));
        setDraftStartDate(task.startDate ?? '');
        setDraftDueDate(task.dueDate ?? '');
        setDraftStatus(task.status);
        setCategoryDropdownOpen(false);
        setProgressDropdownOpen(false);
        setStatusDropdownOpen(false);
        setAssigneesDropdownOpen(false);
        setIsEditing(false);
    };

    const saveEditing = () => {
        const estimatedHours = draftEstimate.trim() ? Number(draftEstimate.replace(',', '.')) : null;
        const completionPercent = Number(draftProgress);
        void onTaskUpdate({
            title: draftTitle.trim() || task.title,
            description: draftDescription.trim() || null,
            category: draftCategory,
            estimatedHours: Number.isFinite(estimatedHours) && estimatedHours !== null && estimatedHours >= 0 ? estimatedHours : null,
            completionPercent: Number.isFinite(completionPercent) ? Math.min(100, Math.max(0, completionPercent)) : 0,
            status: draftStatus !== task.status ? draftStatus : undefined,
            startDate: draftStartDate || null,
            dueDate: draftDueDate || null
        }).then(() => setIsEditing(false));
    };

    return (
        <aside
            onPointerDown={onInteract}
            className={`fixed bottom-[154px] right-3 top-[104px] z-[55] flex w-[min(390px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl text-slate-100 shadow-2xl shadow-black/20 backdrop-blur-xl light:text-slate-900 light:shadow-slate-300/25 sm:right-4 lg:right-6 min-[2200px]:bottom-[88px] ${isEditing
                ? 'border border-brand-500/30 bg-gradient-to-br from-[#020617]/88 via-[#020617]/82 to-brand-950/30 light:border-brand-500/25 light:from-white/95 light:via-white/90 light:to-amber-50/70'
                : 'border border-white/10 bg-[#020617]/82 light:border-slate-200/70 light:bg-white/90'
                } ${isClosing ? 'task-sidebar-exit' : 'task-sidebar-enter'}`}
        >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 light:border-slate-200/70">
                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        {isEditing && task.status !== 'LOCKED' ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setStatusDropdownOpen((open) => !open)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${statusMeta[draftStatus].className}`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {(() => {
                                            const DraftIcon = statusMeta[draftStatus].icon;
                                            return <DraftIcon className="h-3.5 w-3.5" />;
                                        })()}
                                        {statusMeta[draftStatus].label}
                                    </span>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                                </button>
                                {statusDropdownOpen && (
                                    <div className="absolute left-0 top-full z-[90] mt-2 w-48 origin-top overflow-hidden rounded-xl border border-white/10 bg-slate-950/90 p-1.5 shadow-xl backdrop-blur-xl animate-dropdown-slide light:border-slate-200/80 light:bg-white/95">
                                        {([task.status, 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] as const)
                                            .filter((val, idx, self) => self.indexOf(val) === idx)
                                            .map((item) => {
                                                const meta = statusMeta[item];
                                                const Icon = meta.icon;
                                                return (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        onMouseDown={(event) => {
                                                            event.preventDefault();
                                                            setDraftStatus(item);
                                                            setStatusDropdownOpen(false);
                                                        }}
                                                        className="flex w-full items-center rounded-lg px-2.5 py-2 transition hover:bg-white/5 light:hover:bg-slate-50"
                                                    >
                                                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${meta.className}`}>
                                                            <Icon className="h-3 w-3" />
                                                            {meta.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {status.label}
                            </span>
                        )}
                        {isEditing ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setCategoryDropdownOpen((open) => !open)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-100 transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900"
                                >
                                    <span className={`rounded-md border px-1.5 py-0.5 ${categoryClass[draftCategory]}`}>{draftCategory}</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                                </button>
                                {categoryDropdownOpen && (
                                    <div className="absolute left-0 top-full z-[90] mt-2 w-48 origin-top overflow-hidden rounded-xl border border-white/10 bg-slate-950/90 p-1.5 shadow-xl backdrop-blur-xl animate-dropdown-slide light:border-slate-200/80 light:bg-white/95">
                                        {taskCategories.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    setDraftCategory(item);
                                                    setCategoryDropdownOpen(false);
                                                }}
                                                className="flex w-full items-center rounded-lg px-2.5 py-2 transition hover:bg-white/5 light:hover:bg-slate-50"
                                            >
                                                <span className={`rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${categoryClass[item]}`}>{item}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${categoryClass[category]}`}>
                                <Tag className="h-3.5 w-3.5" />
                                {category}
                            </span>
                        )}
                    </div>

                    {isEditing ? (
                        <h2
                            ref={titleRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={(event) => setDraftTitle(event.currentTarget.textContent ?? '')}
                            className="min-h-[2.25rem] rounded-xl border border-brand-500/30 bg-slate-950/50 px-3 py-2 text-lg font-extrabold leading-tight tracking-tight text-white outline-none focus:ring-1 focus:ring-brand-500 light:bg-white/80 light:text-slate-950"
                        >
                            {draftTitle}
                        </h2>
                    ) : (
                        <div className="group/title flex items-start gap-2">
                            <h2 className="line-clamp-3 text-lg font-extrabold leading-tight tracking-tight text-white light:text-slate-950">{task.title}</h2>
                            <button
                                type="button"
                                onClick={startEditing}
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 opacity-0 transition hover:bg-white/5 hover:text-brand-300 group-hover/title:opacity-100 light:hover:bg-slate-950/5 light:hover:text-brand-700"
                                aria-label="Edit task title"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
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

            <div key={`${task.id}-${progress}`} className="workspace-sidebar-scroll min-h-0 flex-1 overflow-y-auto p-4 task-sidebar-content-enter">
                <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400 light:text-slate-500">
                        <span>Progress</span>
                        {isEditing ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setProgressDropdownOpen((open) => !open)}
                                    className="flex items-center justify-between gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-right text-xs font-bold text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900"
                                >
                                    <span>{draftProgress}%</span>
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
                                                    setDraftProgress(String(val));
                                                    setProgressDropdownOpen(false);
                                                }}
                                                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${String(val) === draftProgress ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white light:text-slate-700 light:hover:bg-slate-50 light:hover:text-slate-950'}`}
                                            >
                                                {val}%
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="group/progress flex items-center gap-2">
                                <span className="font-bold text-slate-100 light:text-slate-900">{progress}%</span>
                                <button type="button" onClick={startEditing} className="text-slate-500 opacity-0 transition hover:text-brand-300 group-hover/progress:opacity-100 light:hover:text-brand-700" aria-label="Edit progress"><Pencil className="h-3.5 w-3.5" /></button>
                            </div>
                        )}
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.07] light:bg-slate-200/70">
                        <div key={`${task.id}-${task.status}-${isEditing ? draftProgress : progress}`} className="h-full rounded-full task-sidebar-progress-reveal" style={{ width: `${isEditing ? Math.min(100, Math.max(0, Number(draftProgress) || 0)) : progress}%` }}>
                            <div className={`h-full w-full rounded-full bg-gradient-to-r from-brand-500 via-orange-400 to-brand-500 ${task.status === 'IN_PROGRESS' ? 'animate-progress-flow' : ''}`} />
                        </div>
                    </div>
                </section>

                <section className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500"><Clock className="h-3.5 w-3.5" /> Estimate</div>
                        {isEditing ? (
                            <input value={draftEstimate} onChange={(event) => setDraftEstimate(event.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))} className={`mt-1 ${fieldClass}`} />
                        ) : (
                            <div className="group/estimate mt-1 flex items-center justify-between gap-2 text-sm font-bold text-slate-100 light:text-slate-900">
                                <span>{formatHours(task.estimatedHours)}</span>
                                <button type="button" onClick={startEditing} className="text-slate-500 opacity-0 transition hover:text-brand-300 group-hover/estimate:opacity-100 light:hover:text-brand-700" aria-label="Edit estimate"><Pencil className="h-3.5 w-3.5" /></button>
                            </div>
                        )}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500"><Clock className="h-3.5 w-3.5" /> Logged</div>
                        <div className="mt-1 text-sm font-bold text-slate-100 light:text-slate-900">{formatHours(task.loggedHours)}</div>
                    </div>
                    {(['start', 'due'] as const).map((kind) => {
                        const value = kind === 'start' ? draftStartDate : draftDueDate;
                        const label = kind === 'start' ? 'Start' : 'Due';
                        const display = kind === 'start' ? formatDate(task.startDate) : formatDate(task.dueDate);
                        return (
                            <div key={kind} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> {label}</div>
                                {isEditing ? (
                                    <CustomDateField
                                        label={label}
                                        value={value}
                                        onChange={(nextValue) => kind === 'start' ? setDraftStartDate(nextValue) : setDraftDueDate(nextValue)}
                                    />
                                ) : (
                                    <div className={`group/${kind} mt-1 flex items-center justify-between gap-2 text-sm font-bold text-slate-100 light:text-slate-900`}>
                                        <span>{display}</span>
                                        <button type="button" onClick={startEditing} className={`text-slate-500 opacity-0 transition hover:text-brand-300 group-hover/${kind}:opacity-100 light:hover:text-brand-700`} aria-label={`Edit ${label.toLowerCase()} date`}><Pencil className="h-3.5 w-3.5" /></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </section>

                <section className="mt-4">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</h3>
                        {!isEditing && <button type="button" onClick={startEditing} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-brand-300 light:hover:bg-slate-950/5 light:hover:text-brand-700" aria-label="Edit description"><Pencil className="h-3.5 w-3.5" /></button>}
                    </div>
                    {isEditing ? (
                        <textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} rows={4} className={`${fieldClass} mt-2 resize-none leading-relaxed`} />
                    ) : (
                        <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-sm leading-relaxed text-slate-300 light:border-slate-200/70 light:bg-white/55 light:text-slate-700">{task.description?.trim() || 'No description provided.'}</p>
                    )}
                </section>

                <section className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Time logs</h3>
                    {timeLogsLoading ? (
                        <div className="mt-3 flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                        </div>
                    ) : timeLogs.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                            {timeLogs.map((log) => {
                                const isOwn = log.userId === currentUserId;
                                return (
                                    <li key={log.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-100 light:text-slate-900">
                                                <Clock className="h-3.5 w-3.5 text-sky-400 light:text-sky-600" />
                                                <span>{formatHours(log.hours)}</span>
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">{log.userDisplayName} · {formatDateTime(log.loggedAt)}</div>
                                            {log.comment && <p className="mt-1.5 text-xs text-slate-400 light:text-slate-600">{log.comment}</p>}
                                        </div>
                                        {isOwn && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    setDeletingLogId(log.id);
                                                    await onTimeLogDelete(log);
                                                    const logs = await projectsApi.listTaskTimeLogs(task.id);
                                                    setTimeLogs(logs);
                                                    setDeletingLogId(null);
                                                }}
                                                disabled={deletingLogId === log.id}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/50 text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 light:border-slate-200/70 light:bg-white/60 light:text-slate-500 light:hover:bg-red-50 light:hover:text-red-600"
                                                aria-label="Delete time log"
                                            >
                                                {deletingLogId === log.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-slate-500">No time logs yet.</p>
                    )}
                </section>

                <section className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Assignees</h3>
                    <div className="relative mt-2">
                        <button
                            type="button"
                            onClick={() => setAssigneesDropdownOpen((open) => !open)}
                            disabled={assigneeUpdating}
                            className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm font-medium text-slate-100 transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-60 light:border-slate-200 light:bg-white light:text-slate-900"
                        >
                            <span className="truncate">{assignees.length > 0 ? `${assignees.length} assigned` : 'Select assignees'}</span>
                            <div className="flex items-center gap-2">
                                {assigneeUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />}
                                <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${assigneesDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        {assigneesDropdownOpen && (
                            <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[90] w-full origin-top rounded-2xl border border-white/10 bg-slate-950/95 p-1.5 shadow-xl backdrop-blur-xl animate-dropdown-slide light:border-slate-200/80 light:bg-white/95">
                                {members.length > 0 ? members.map((member) => {
                                    const selected = assignees.some((a) => a.userId === member.userId);
                                    return (
                                        <button
                                            key={member.userId}
                                            type="button"
                                            disabled={assigneeUpdating}
                                            onClick={async () => {
                                                if (assigneeUpdating) return;
                                                const nextIds = selected
                                                    ? assignees.filter((a) => a.userId !== member.userId).map((a) => a.userId)
                                                    : [...assignees.map((a) => a.userId), member.userId];
                                                setAssigneeUpdating(true);
                                                await onAssigneesChange(nextIds);
                                                setAssigneeUpdating(false);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/5 disabled:opacity-50 light:hover:bg-slate-50"
                                        >
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-950 bg-slate-800 text-[10px] font-bold text-slate-200 light:border-white light:bg-slate-100 light:text-slate-700">
                                                {member.avatarUrl ? <img src={member.avatarUrl} alt={member.displayName} className="h-full w-full object-cover" /> : getInitials(member.displayName)}
                                            </div>
                                            <span className="flex-1 truncate text-xs font-semibold text-slate-200 light:text-slate-800">{member.displayName}</span>
                                            <span className="text-[10px] font-medium text-slate-500">{member.role}</span>
                                            {selected && <CheckCircle2 className="h-4 w-4 text-brand-400 light:text-brand-600" />}
                                        </button>
                                    );
                                }) : <div className="px-3 py-2 text-xs text-slate-500">No project members available.</div>}
                            </div>
                        )}
                    </div>
                    {assignees.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {assignees.map((assignee) => (
                                <div key={assignee.userId} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs font-semibold text-slate-300 light:border-slate-200/70 light:bg-white/55 light:text-slate-700">
                                    <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-slate-950 bg-slate-800 text-[9px] font-bold text-slate-200 light:border-white light:bg-slate-100 light:text-slate-700">
                                        {assignee.avatarUrl ? <img src={assignee.avatarUrl} alt={assignee.displayName} className="h-full w-full object-cover" /> : getInitials(assignee.displayName)}
                                    </div>
                                    {assignee.displayName}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {hasEnrichmentDetails ? (
                    <section className="mt-4 space-y-3">
                        {checklist.length > 0 && <div><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Checklist</h3><ul className="mt-2 space-y-1.5 rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">{checklist.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-sm text-slate-300 light:text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400 light:text-emerald-600" /><span>{item}</span></li>)}</ul></div>}
                        {pitfalls.length > 0 && <div><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Pitfalls</h3><ul className="mt-2 space-y-1.5 rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">{pitfalls.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-sm text-slate-300 light:text-slate-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 light:text-amber-600" /><span>{item}</span></li>)}</ul></div>}
                        {links.length > 0 && <div><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Links</h3><div className="mt-2 space-y-1.5">{links.map((link, index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm font-semibold text-brand-300 transition hover:bg-white/5 hover:text-brand-200 light:border-slate-200/70 light:bg-white/55 light:text-brand-700 light:hover:bg-slate-50"><span className="line-clamp-1">{link.title}</span><ExternalLink className="h-4 w-4 shrink-0" /></a>)}</div></div>}
                    </section>
                ) : (
                    isEnriching && (
                        <section className="mt-4 space-y-4 animate-pulse">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Checklist</h3>
                                <div className="mt-2 space-y-2.5 rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-4 w-4 rounded-full bg-slate-800/60 light:bg-slate-200/80 shrink-0" />
                                        <div className="h-3 w-3/4 rounded bg-slate-800/60 light:bg-slate-200/80" />
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-4 w-4 rounded-full bg-slate-800/60 light:bg-slate-200/80 shrink-0" />
                                        <div className="h-3 w-1/2 rounded bg-slate-800/60 light:bg-slate-200/80" />
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-4 w-4 rounded-full bg-slate-800/60 light:bg-slate-200/80 shrink-0" />
                                        <div className="h-3 w-5/6 rounded bg-slate-800/60 light:bg-slate-200/80" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Pitfalls</h3>
                                <div className="mt-2 space-y-2.5 rounded-2xl border border-white/10 bg-slate-950/35 p-3 light:border-slate-200/70 light:bg-white/55">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-4 w-4 rounded-full bg-slate-800/60 light:bg-slate-200/80 shrink-0" />
                                        <div className="h-3 w-2/3 rounded bg-slate-800/60 light:bg-slate-200/80" />
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-4 w-4 rounded-full bg-slate-800/60 light:bg-slate-200/80 shrink-0" />
                                        <div className="h-3 w-4/5 rounded bg-slate-800/60 light:bg-slate-200/80" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )
                )}
            </div>

            {isEditing && (
                <footer className="border-t border-white/10 bg-[#020617]/88 p-3 backdrop-blur-xl light:border-slate-200/70 light:bg-white/92">
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-500/20 bg-brand-500/10 p-2.5 light:bg-brand-500/10">
                        <div>
                            <h3 className="text-xs font-extrabold uppercase tracking-wide text-brand-300 light:text-brand-700">Edit task</h3>
                            <p className="mt-0.5 text-[11px] text-slate-400 light:text-slate-600">Save or discard changes.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={cancelEditing} disabled={updating} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-200 disabled:opacity-50 light:text-slate-600 light:hover:bg-slate-950/5 light:hover:text-slate-900">Cancel</button>
                            <button type="button" onClick={saveEditing} disabled={updating} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-orange-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition hover:shadow-brand-500/30 disabled:opacity-70"><Save className="h-3.5 w-3.5" /> Save</button>
                        </div>
                    </div>
                </footer>
            )}
        </aside>
    );
}
