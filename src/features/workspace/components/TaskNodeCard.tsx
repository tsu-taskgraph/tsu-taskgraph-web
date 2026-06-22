import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  CheckCircle2,
  Clock,
  CircleDashed,
  Hourglass,
  Lock,
  UserRound,
  Zap
} from 'lucide-react';
import type { TaskNode } from '../../../api/projects';
import type { TaskStatus, TaskFlowNode, ThemeMode } from '../utils/workspaceUtils';

type TaskCategory = NonNullable<TaskNode['category']>;

const statusConfig: Record<TaskStatus, {
  label: string;
  icon: typeof Lock;
  nodeClass: string;
  badgeClass: string;
  dotClass: string;
  edge: string;
}> = {
  LOCKED: {
    label: 'Locked',
    icon: Lock,
    nodeClass: 'border-white/10 bg-[#020617]/70 shadow-lg shadow-black/10 light:bg-white/75 light:border-slate-200/60 light:shadow-slate-200/10 opacity-75',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200',
    dotClass: 'bg-slate-500',
    edge: '#64748b'
  },
  AVAILABLE: {
    label: 'Available',
    icon: Zap,
    nodeClass: 'border-amber-500/35 bg-[#020617]/70 shadow-lg shadow-black/10 light:bg-white/75 light:border-amber-500/35 light:shadow-slate-200/10',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25 light:bg-amber-500/15 light:text-amber-700 light:border-amber-500/30',
    dotClass: 'bg-amber-400',
    edge: '#f59e0b'
  },
  IN_PROGRESS: {
    label: 'In progress',
    icon: Hourglass,
    nodeClass: 'border-sky-500/35 bg-[#020617]/70 shadow-lg shadow-black/10 light:bg-white/75 light:border-sky-500/35 light:shadow-slate-200/10',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/25 light:bg-sky-500/15 light:text-sky-700 light:border-sky-500/30',
    dotClass: 'bg-sky-400',
    edge: '#38bdf8'
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    nodeClass: 'border-emerald-500/35 bg-[#020617]/70 shadow-lg shadow-black/10 light:bg-white/75 light:border-emerald-500/35 light:shadow-slate-200/10',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 light:bg-emerald-500/15 light:text-emerald-700 light:border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    edge: '#10b981'
  },
  SKIPPED: {
    label: 'Skipped',
    icon: CircleDashed,
    nodeClass: 'border-violet-500/35 bg-[#020617]/70 shadow-lg shadow-black/10 light:bg-white/75 light:border-violet-500/35 light:shadow-slate-200/10 opacity-80',
    badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/25 light:bg-violet-500/15 light:text-violet-700 light:border-violet-500/30',
    dotClass: 'bg-violet-400',
    edge: '#8b5cf6'
  }
};

const categoryConfig: Record<TaskCategory, string> = {
  BACKEND: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 light:bg-indigo-500/10 light:text-indigo-700 light:border-indigo-500/20',
  FRONTEND: 'bg-pink-500/10 text-pink-300 border-pink-500/20 light:bg-pink-500/10 light:text-pink-700 light:border-pink-500/20',
  DEVOPS: 'bg-orange-500/10 text-orange-300 border-orange-500/20 light:bg-orange-500/10 light:text-orange-700 light:border-orange-500/20',
  TESTING: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 light:bg-emerald-500/10 light:text-emerald-700 light:border-emerald-500/20',
  DOCUMENTATION: 'bg-blue-500/10 text-blue-300 border-blue-500/20 light:bg-blue-500/10 light:text-blue-700 light:border-blue-500/20',
  DESIGN: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20 light:bg-fuchsia-500/10 light:text-fuchsia-700 light:border-fuchsia-500/20',
  OTHER: 'bg-slate-500/10 text-slate-300 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200'
};

const statusSkin: Record<TaskStatus, {
  borderClass: string;
  railClass: string;
  glowClass: string;
  iconClass: string;
  progressClass: string;
  mutedClass: string;
}> = {
  LOCKED: {
    borderClass: 'border-white/10 light:border-slate-200/70',
    railClass: 'from-slate-500 to-slate-400',
    glowClass: 'bg-slate-500/10',
    iconClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200',
    progressClass: 'from-slate-500 to-slate-400',
    mutedClass: ''
  },
  AVAILABLE: {
    borderClass: 'border-amber-500/30 light:border-amber-500/35',
    railClass: 'from-brand-400 to-orange-500',
    glowClass: 'bg-brand-500/15',
    iconClass: 'bg-brand-500/10 text-brand-300 border-brand-500/20 light:bg-brand-500/10 light:text-brand-700 light:border-brand-500/25',
    progressClass: 'from-brand-500 to-orange-500',
    mutedClass: ''
  },
  IN_PROGRESS: {
    borderClass: 'border-sky-500/35 light:border-sky-500/35',
    railClass: 'from-sky-400 to-blue-500',
    glowClass: 'bg-sky-500/15',
    iconClass: 'bg-sky-500/10 text-sky-300 border-sky-500/20 light:bg-sky-500/10 light:text-sky-700 light:border-sky-500/25',
    progressClass: 'from-sky-500 to-blue-500',
    mutedClass: ''
  },
  COMPLETED: {
    borderClass: 'border-emerald-500/35 light:border-emerald-500/35',
    railClass: 'from-emerald-400 to-teal-500',
    glowClass: 'bg-emerald-500/15',
    iconClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 light:bg-emerald-500/10 light:text-emerald-700 light:border-emerald-500/25',
    progressClass: 'from-emerald-500 to-teal-500',
    mutedClass: ''
  },
  SKIPPED: {
    borderClass: 'border-violet-500/30 light:border-violet-500/35',
    railClass: 'from-violet-400 to-fuchsia-500',
    glowClass: 'bg-violet-500/15',
    iconClass: 'bg-violet-500/10 text-violet-300 border-violet-500/20 light:bg-violet-500/10 light:text-violet-700 light:border-violet-500/25',
    progressClass: 'from-violet-500 to-fuchsia-500',
    mutedClass: ''
  }
};

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function getTaskProgress(task: TaskNode) {
  return typeof task.completionPercent === 'number' ? task.completionPercent : 0;
}

function formatHours(hours: number | null | undefined) {
  return `${hours ?? 0}h`;
}

interface TaskNodeCardProps extends NodeProps<TaskFlowNode> {
  theme?: ThemeMode;
}

export function TaskNodeCard({ data, selected }: TaskNodeCardProps) {
  const task = data.task;
  const viewMode = data.viewMode;
  const status = statusConfig[task.status] ?? statusConfig.AVAILABLE;
  const skin = statusSkin[task.status] ?? statusSkin.AVAILABLE;
  const StatusIcon = status.icon;
  const progress = Math.min(100, Math.max(0, getTaskProgress(task)));
  const assignees = task.assignees ?? [];
  const visibleAssignees = assignees.slice(0, 3);
  const category = task.category ?? 'OTHER';
  const description = task.description?.trim();
  const estimatedHours = task.estimatedHours ?? 0;
  const loggedHours = task.loggedHours ?? 0;
  const timePercent = estimatedHours > 0 ? Math.min(100, Math.round((loggedHours / estimatedHours) * 100)) : 0;
  const layerLabel = typeof task.layer === 'number' ? `Layer ${task.layer}` : 'Auto layer';
  const compactLayerLabel = typeof task.layer === 'number' ? `L${task.layer}` : 'Auto';
  const surfaceClass = `border bg-slate-900/40 shadow-lg shadow-black/10 backdrop-blur-2xl light:bg-white/60 light:shadow-slate-200/10 ${skin.borderClass} ${skin.mutedClass}`;
  const selectedClass = selected
    ? 'scale-[1.02]'
    : 'hover:-translate-y-1 hover:border-brand-500/45 light:hover:border-brand-500/50';
  const selectedHaloClass = 'pointer-events-none absolute -inset-1.5 z-20 rounded-[inherit] border-2 border-brand-300/80 shadow-[0_0_0_4px_rgba(245,158,11,0.18),0_0_24px_rgba(245,158,11,0.26)] light:border-brand-500/80 light:shadow-[0_0_0_4px_rgba(217,119,6,0.14),0_0_22px_rgba(217,119,6,0.18)]';
  const hiddenHandleClass = '!h-3 !w-3 !border-2 !border-slate-950 !bg-brand-500 !opacity-0 pointer-events-none group-hover:!opacity-70 group-hover:pointer-events-auto transition-all duration-250 ease-out light:!border-white light:!bg-brand-500 hover:!opacity-100 hover:!shadow-[0_0_8px_#f59e0b] light:hover:!shadow-[0_0_8px_#f59e0b]';

  const statusAnimClass =
    task.status === 'IN_PROGRESS' ? 'animate-in-progress-node' :
      task.status === 'AVAILABLE' ? 'animate-available-node' :
        task.status === 'COMPLETED' ? 'animate-completed-node' :
          task.status === 'LOCKED' ? 'animate-locked-node' :
            task.status === 'SKIPPED' ? 'animate-skipped-node' : '';

  const iconAnimClass =
    task.status === 'IN_PROGRESS' ? 'animate-hourglass-turn' :
      task.status === 'AVAILABLE' ? 'animate-zap-flash' :
        task.status === 'COMPLETED' ? 'animate-completed-icon' :
          task.status === 'LOCKED' ? 'animate-locked-icon' :
            task.status === 'SKIPPED' ? 'animate-skipped-icon' : '';

  if (viewMode === 'dot') {
    return (
      <div
        key="dot"
        className="group relative flex items-center justify-center rounded-2xl pointer-events-auto animate-view-change"
      >

        <div
          className={`relative z-10 flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl transition-all duration-300 ${surfaceClass} ${selected
            ? 'scale-110'
            : 'hover:scale-110'
            } ${statusAnimClass}`}
        >
          {selected && <div className="pointer-events-none absolute -inset-0.5 z-20 rounded-[inherit] border-2 border-brand-300/85 shadow-[0_0_0_4px_rgba(245,158,11,0.18),0_0_22px_rgba(245,158,11,0.28)] light:border-brand-500/85 light:shadow-[0_0_0_4px_rgba(217,119,6,0.14),0_0_20px_rgba(217,119,6,0.18)]" />}
          <div className={`absolute -inset-5 rounded-full ${skin.glowClass} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`} />
          <div className={`absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b ${skin.railClass}`} />
          <StatusIcon className={`relative z-10 h-[18px] w-[18px] text-slate-200 light:text-slate-700 ${iconAnimClass}`} />
        </div>

        {assignees.length > 0 && (
          <div className="absolute -bottom-1 -right-1 z-30 flex -space-x-1">
            {assignees.slice(0, 2).map((assignee) => (
              <div
                key={assignee.userId}
                title={assignee.displayName}
                className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-slate-950 bg-slate-800 text-[8px] font-bold text-slate-200 light:border-white light:bg-slate-100 light:text-slate-700"
              >
                {assignee.avatarUrl ? <img src={assignee.avatarUrl} alt={assignee.displayName} className="h-full w-full object-cover" /> : getInitials(assignee.displayName)}
              </div>
            ))}
            {assignees.length > 2 && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-950 bg-brand-500/15 text-[8px] font-bold text-brand-300 light:border-white light:text-brand-700">
                +{assignees.length - 2}
              </div>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 w-80 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs opacity-0 shadow-lg shadow-black/10 backdrop-blur-2xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className={`rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${categoryConfig[category]}`}>
              {category}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${status.badgeClass}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>
          <h4 className="line-clamp-2 text-sm font-bold leading-snug text-white light:text-slate-900">{task.title}</h4>
          {description && (
            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-400 light:text-slate-600">
              {description}
            </p>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 light:border-slate-200/40">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Progress</div>
              <div className="mt-0.5 font-bold text-slate-200 light:text-slate-800">{progress}%</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Time</div>
              <div className="mt-0.5 font-bold text-slate-200 light:text-slate-800">{formatHours(loggedHours)} / {formatHours(estimatedHours)}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Layer</div>
              <div className="mt-0.5 font-bold text-slate-200 light:text-slate-800">{compactLayerLabel}</div>
            </div>
          </div>
        </div>

        <Handle type="target" position={Position.Left} className={`${hiddenHandleClass} !z-50 cursor-crosshair`} />
        <Handle type="source" position={Position.Right} className={`${hiddenHandleClass} !z-50 cursor-crosshair`} />
      </div>
    );
  }

  if (viewMode === 'label') {
    return (
      <div
        key="label"
        className={`group relative w-[292px] rounded-2xl transition-all duration-300 ${selectedClass} animate-view-change ${statusAnimClass}`}
      >
        {selected && <div className={selectedHaloClass} />}

        <div className={`w-full overflow-hidden rounded-2xl relative ${surfaceClass}`}>
          <div className={`absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b ${skin.railClass}`} />
          <div className={`absolute -right-12 -top-12 h-28 w-28 rounded-full ${skin.glowClass} blur-3xl transition-opacity duration-300 group-hover:opacity-100`} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent light:via-slate-300/80" />

          <div className="relative p-3.5 pl-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${skin.iconClass}`}>
                <StatusIcon className={`h-[18px].w-[18px] ${iconAnimClass}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-[13px] font-bold leading-snug tracking-tight text-slate-100 light:text-slate-900">
                    {task.title}
                  </h3>
                  <span className="shrink-0 rounded-lg border border-white/5 bg-slate-950/40 px-2 py-1 text-[10px] font-bold text-slate-300 backdrop-blur-sm light:border-slate-200/40 light:bg-white/45 light:text-slate-700">
                    {progress}%
                  </span>
                </div>

                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className={`max-w-[112px] truncate rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${categoryConfig[category]}`}>
                    {category}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-slate-950/40 px-2 py-0.5 text-[9px] font-semibold text-slate-400 backdrop-blur-sm light:border-slate-200/50 light:bg-white/45 light:text-slate-600">
                    {compactLayerLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-slate-950/40 px-2 py-0.5 text-[9px] font-semibold text-slate-400 backdrop-blur-sm light:border-slate-200/50 light:bg-white/45 light:text-slate-600">
                    <Clock className="h-3 w-3" />
                    {formatHours(loggedHours)} / {formatHours(estimatedHours)}
                  </span>
                  {assignees.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {assignees.slice(0, 3).map((assignee) => (
                        <div
                          key={assignee.userId}
                          title={assignee.displayName}
                          className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-slate-950 bg-slate-800 text-[9px] font-bold text-slate-200 light:border-white light:bg-slate-100 light:text-slate-700"
                        >
                          {assignee.avatarUrl ? <img src={assignee.avatarUrl} alt={assignee.displayName} className="h-full w-full object-cover" /> : getInitials(assignee.displayName)}
                        </div>
                      ))}
                      {assignees.length > 3 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-950 bg-brand-500/15 text-[9px] font-bold text-brand-300 light:border-white light:text-brand-700">
                          +{assignees.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07] light:bg-slate-200/70">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${skin.progressClass} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <Handle type="target" position={Position.Left} className={`${hiddenHandleClass} !z-50 cursor-crosshair`} />
        <Handle type="source" position={Position.Right} className={`${hiddenHandleClass} !z-50 cursor-crosshair`} />
      </div>
    );
  }

  return (
    <div
      key="detail"
      className={`group relative w-[318px] rounded-3xl transition-all duration-300 ${selectedClass} animate-view-change ${statusAnimClass}`}
    >
      {selected && <div className={selectedHaloClass} />}

      <div className={`w-full overflow-hidden rounded-3xl relative ${surfaceClass}`}>
        <div className={`absolute inset-y-5 left-0 w-1 rounded-r-full bg-gradient-to-b ${skin.railClass}`} />
        <div className={`absolute -right-16 -top-16 h-36 w-36 rounded-full ${skin.glowClass} blur-3xl transition-opacity duration-300 group-hover:opacity-100`} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent light:via-slate-300/80" />

        <div className="relative flex flex-col gap-4 p-4 pl-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${skin.iconClass}`}>
                <StatusIcon className={`h-5 w-5 ${iconAnimClass}`} />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${categoryConfig[category]}`}>
                    {category}
                  </span>
                  <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${status.badgeClass}`}>
                    {status.label}
                  </span>
                </div>
                <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-slate-100 light:text-slate-900">
                  {task.title}
                </h3>
              </div>
            </div>
          </div>

          {description && (
            <p className="line-clamp-2 text-[12px] leading-relaxed text-slate-400 light:text-slate-600">
              {description}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-md p-2.5 light:border-slate-200/50 light:bg-white/45">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Estimate</div>
              <div className="mt-1 text-xs font-bold text-slate-200 light:text-slate-800">{formatHours(estimatedHours)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-md p-2.5 light:border-slate-200/50 light:bg-white/45">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Logged</div>
              <div className="mt-1 text-xs font-bold text-slate-200 light:text-slate-800">{formatHours(loggedHours)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-md p-2.5 light:border-slate-200/50 light:bg-white/45">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Layer</div>
              <div className="mt-1 truncate text-xs font-bold text-slate-200 light:text-slate-800">{layerLabel}</div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400 light:text-slate-500">
              <span>Task progress</span>
              <span className="font-bold text-slate-100 light:text-slate-900">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.07] light:bg-slate-200/70">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${skin.progressClass} transition-all duration-500 ${task.status === 'IN_PROGRESS' ? 'animate-progress-flow' : ''
                  }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3 light:border-slate-200/70">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                {visibleAssignees.length > 0 ? visibleAssignees.map((assignee) => (
                  <div
                    key={assignee.userId}
                    title={assignee.displayName}
                    className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-slate-950 bg-slate-800 text-[10px] font-bold text-slate-200 light:border-white light:bg-slate-100 light:text-slate-700"
                  >
                    {assignee.avatarUrl ? (
                      <img src={assignee.avatarUrl} alt={assignee.displayName} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(assignee.displayName)
                    )}
                  </div>
                )) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-700 bg-slate-800/30 text-slate-500 light:border-slate-300 light:bg-slate-100/50">
                    <UserRound className="h-3.5 w-3.5" />
                  </div>
                )}
                {assignees.length > 3 && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-950 bg-brand-500/15 text-[9px] font-bold text-brand-300 light:border-white light:text-brand-700">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
              <span className="truncate text-[10px] font-semibold text-slate-500 light:text-slate-500">
                {assignees.length > 0 ? `${assignees.length} assigned` : 'Unassigned'}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-[#020617]/45 backdrop-blur-md px-2 py-1 text-[10px] font-bold text-slate-400 light:border-slate-200/50 light:bg-white/45 light:text-slate-600">
              <Clock className="h-3.5 w-3.5" />
              <span>{timePercent}% time</span>
            </div>
          </div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-slate-950 !bg-brand-400 !opacity-70 light:!border-white light:!bg-brand-500 !z-50 cursor-crosshair hover:!opacity-100 hover:!shadow-[0_0_8px_#f59e0b] light:hover:!shadow-[0_0_8px_#f59e0b] transition-all duration-250 ease-out"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-slate-950 !bg-brand-400 !opacity-70 light:!border-white light:!bg-brand-500 !z-50 cursor-crosshair hover:!opacity-100 hover:!shadow-[0_0_8px_#f59e0b] light:hover:!shadow-[0_0_8px_#f59e0b] transition-all duration-250 ease-out"
      />
    </div>
  );
}
