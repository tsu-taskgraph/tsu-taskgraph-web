import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock,
  CornerDownRight,
  GitBranch,
  GitCommit,
  Hourglass,
  LayoutGrid,
  Lock,
  Minus,
  Moon,
  Network,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Spline,
  Sun,
  Tag,
  UserRound,
  Zap
} from 'lucide-react';
import { projectsApi, type ProjectGraphResponse, type ProjectResponse, type TaskNode } from '../api/projects';
import { mapServerErrorToEnglish } from '../api/errors';
import { useTheme } from '../context/ThemeContext';
import { SafariTopBar } from '../components/SafariTopBar';
import { SafariBottomBar } from '../components/SafariBottomBar';

type ViewMode = 'dot' | 'label' | 'full';
type EdgeTypeMode = 'smoothstep' | 'default' | 'straight' | 'step';
type ThemeMode = 'light' | 'dark';

type TaskFlowNodeData = {
  task: TaskNode;
  viewMode: ViewMode;
  index?: number;
};

type TaskFlowNode = Node<TaskFlowNodeData, 'taskNode'>;
type TaskFlowEdge = Edge;

type TaskStatus = TaskNode['status'];
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
    mutedClass: 'opacity-70'
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
    mutedClass: 'opacity-80'
  }
};

const projectStatusClass: Record<ProjectResponse['status'], string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 light:bg-emerald-500/15 light:text-emerald-700 light:border-emerald-500/30',
  COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20 light:bg-blue-500/15 light:text-blue-700 light:border-blue-500/30',
  ARCHIVED: 'bg-slate-500/10 text-slate-400 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200',
  PENDING_AI: 'bg-amber-500/10 text-amber-400 border-amber-500/20 light:bg-amber-500/15 light:text-amber-700 light:border-amber-500/30'
};

const viewModes = [
  { key: 'dot' as const, label: 'Dots', icon: Circle },
  { key: 'label' as const, label: 'Labels', icon: Tag },
  { key: 'full' as const, label: 'Full view', icon: LayoutGrid }
];

const edgeTypeModes = [
  { key: 'smoothstep' as const, label: 'Rounded', icon: Spline },
  { key: 'default' as const, label: 'Curved', icon: GitCommit },
  { key: 'straight' as const, label: 'Straight', icon: Minus },
  { key: 'step' as const, label: 'Step', icon: CornerDownRight }
];

function getEdgeVisual(theme: ThemeMode, sourceStatus?: TaskStatus, targetStatus?: TaskStatus) {
  const palette = {
    brand: theme === 'light' ? '#d97706' : '#f59e0b',
    sky: theme === 'light' ? '#0284c7' : '#38bdf8',
    emerald: theme === 'light' ? '#059669' : '#34d399',
    violet: theme === 'light' ? '#7c3aed' : '#a78bfa',
    slate: theme === 'light' ? 'rgba(100, 116, 139, 0.58)' : 'rgba(148, 163, 184, 0.46)',
    neutral: theme === 'light' ? 'rgba(100, 116, 139, 0.48)' : 'rgba(148, 163, 184, 0.38)'
  };

  if (sourceStatus === 'LOCKED' || targetStatus === 'LOCKED') {
    return {
      color: palette.slate,
      strokeWidth: 1.55,
      dashArray: '7 7',
      animated: false,
      opacity: 0.78,
      filter: 'none'
    };
  }

  if (sourceStatus === 'SKIPPED' || targetStatus === 'SKIPPED') {
    return {
      color: palette.violet,
      strokeWidth: 1.8,
      dashArray: '8 6',
      animated: false,
      opacity: 0.82,
      filter: theme === 'light' ? 'drop-shadow(0 2px 6px rgba(124, 58, 237, 0.14))' : 'drop-shadow(0 2px 7px rgba(167, 139, 250, 0.18))'
    };
  }

  if (sourceStatus === 'IN_PROGRESS') {
    return {
      color: palette.sky,
      strokeWidth: 2.6,
      dashArray: undefined,
      animated: true,
      opacity: 0.95,
      filter: theme === 'light' ? 'drop-shadow(0 2px 7px rgba(2, 132, 199, 0.16))' : 'drop-shadow(0 2px 8px rgba(56, 189, 248, 0.22))'
    };
  }

  if (sourceStatus === 'COMPLETED') {
    return {
      color: palette.emerald,
      strokeWidth: 2.15,
      dashArray: undefined,
      animated: false,
      opacity: 0.92,
      filter: theme === 'light' ? 'drop-shadow(0 2px 6px rgba(5, 150, 105, 0.12))' : 'drop-shadow(0 2px 7px rgba(52, 211, 153, 0.18))'
    };
  }

  if (sourceStatus === 'AVAILABLE') {
    return {
      color: palette.brand,
      strokeWidth: 2,
      dashArray: undefined,
      animated: false,
      opacity: 0.9,
      filter: theme === 'light' ? 'drop-shadow(0 2px 6px rgba(217, 119, 6, 0.14))' : 'drop-shadow(0 2px 7px rgba(245, 158, 11, 0.20))'
    };
  }

  return {
    color: palette.neutral,
    strokeWidth: 1.8,
    dashArray: undefined,
    animated: false,
    opacity: 0.72,
    filter: 'none'
  };
}

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function getTaskProgress(task: TaskNode) {
  if (typeof task.completionPercent === 'number') return task.completionPercent;
  if (task.status === 'COMPLETED') return 100;
  if (task.status === 'IN_PROGRESS') return 50;
  return 0;
}

function formatHours(hours: number | null | undefined) {
  return `${hours ?? 0}h`;
}

function TaskNodeCard({ data, selected }: NodeProps<TaskFlowNode>) {
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
  const surfaceClass = `border bg-[#020617]/80 shadow-[0_16px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl light:bg-white/80 light:shadow-[0_16px_40px_rgba(148,163,184,0.16)] ${skin.borderClass} ${skin.mutedClass}`;
  const selectedClass = selected
    ? 'scale-[1.02] border-brand-400/75 ring-2 ring-brand-500/35 ring-offset-2 ring-offset-slate-950 light:border-brand-500/75 light:ring-brand-500/25 light:ring-offset-white/50'
    : 'hover:-translate-y-1 hover:border-brand-500/45 light:hover:border-brand-500/50';
  const hiddenHandleClass = '!h-2 !w-2 !border-0 !bg-brand-400 !opacity-0 light:!bg-brand-500';

  if (viewMode === 'dot') {
    return (
      <div className="group relative flex items-center justify-center pointer-events-auto">
        <Handle type="target" position={Position.Left} className={hiddenHandleClass} />

        <div
          className={`relative z-10 flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl transition-all duration-300 ${surfaceClass} ${selected
            ? 'scale-110 ring-2 ring-brand-500/40 ring-offset-2 ring-offset-slate-950 light:ring-offset-white'
            : 'hover:scale-110'
            } ${task.status === 'IN_PROGRESS' ? 'animate-in-progress-node' : ''}`}
        >
          <div className={`absolute -inset-5 rounded-full ${skin.glowClass} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`} />
          <div className={`absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b ${skin.railClass}`} />
          <StatusIcon className={`relative z-10 h-[18px] w-[18px] text-slate-200 light:text-slate-700 ${task.status === 'IN_PROGRESS' ? 'animate-hourglass-turn' : ''}`} />
        </div>

        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 w-80 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/10 bg-[#020617]/82 p-4 text-xs opacity-0 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 light:border-slate-200/70 light:bg-white/90 light:shadow-[0_18px_45px_rgba(148,163,184,0.16)]">
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
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 light:border-slate-200/70">
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

        <Handle type="source" position={Position.Right} className={hiddenHandleClass} />
      </div>
    );
  }

  if (viewMode === 'label') {
    return (
      <div
        className={`group relative w-[292px] overflow-hidden rounded-2xl transition-all duration-300 ${surfaceClass} ${selectedClass} ${task.status === 'IN_PROGRESS' ? 'animate-in-progress-node' : ''
          }`}
      >
        <Handle type="target" position={Position.Left} className={hiddenHandleClass} />
        <Handle type="source" position={Position.Right} className={hiddenHandleClass} />

        <div className={`absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b ${skin.railClass}`} />
        <div className={`absolute -right-12 -top-12 h-28 w-28 rounded-full ${skin.glowClass} blur-3xl transition-opacity duration-300 group-hover:opacity-100`} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent light:via-slate-300/80" />

        <div className="relative p-3.5 pl-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${skin.iconClass}`}>
              <StatusIcon className={`h-[18px] w-[18px] ${task.status === 'IN_PROGRESS' ? 'animate-hourglass-turn' : ''}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-[13px] font-bold leading-snug tracking-tight text-slate-100 light:text-slate-900">
                  {task.title}
                </h3>
                <span className="shrink-0 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300 light:bg-slate-100/70 light:text-slate-700">
                  {progress}%
                </span>
              </div>

              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                <span className={`max-w-[112px] truncate rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${categoryConfig[category]}`}>
                  {category}
                </span>
                <span className="rounded-lg border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-slate-400 light:border-slate-200/70 light:bg-slate-50/70 light:text-slate-600">
                  {compactLayerLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-slate-400 light:border-slate-200/70 light:bg-slate-50/70 light:text-slate-600">
                  <Clock className="h-3 w-3" />
                  {formatHours(loggedHours)} / {formatHours(estimatedHours)}
                </span>
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
    );
  }

  return (
    <div
      className={`group relative w-[318px] overflow-hidden rounded-3xl transition-all duration-300 ${surfaceClass} ${selectedClass} ${task.status === 'IN_PROGRESS' ? 'animate-in-progress-node' : ''
        }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-slate-950 !bg-brand-400 !opacity-80 light:!border-white light:!bg-brand-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-slate-950 !bg-brand-400 !opacity-80 light:!border-white light:!bg-brand-500"
      />

      <div className={`absolute inset-y-5 left-0 w-1 rounded-r-full bg-gradient-to-b ${skin.railClass}`} />
      <div className={`absolute -right-16 -top-16 h-36 w-36 rounded-full ${skin.glowClass} blur-3xl transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent light:via-slate-300/80" />

      <div className="relative flex flex-col gap-4 p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${skin.iconClass}`}>
              <StatusIcon className={`h-5 w-5 ${task.status === 'IN_PROGRESS' ? 'animate-hourglass-turn' : ''}`} />
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
          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-2.5 light:border-slate-200/70 light:bg-slate-50/70">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Estimate</div>
            <div className="mt-1 text-xs font-bold text-slate-200 light:text-slate-800">{formatHours(estimatedHours)}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-2.5 light:border-slate-200/70 light:bg-slate-50/70">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Logged</div>
            <div className="mt-1 text-xs font-bold text-slate-200 light:text-slate-800">{formatHours(loggedHours)}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-2.5 light:border-slate-200/70 light:bg-slate-50/70">
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

          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/5 bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-slate-400 light:border-slate-200/70 light:bg-slate-50/70 light:text-slate-600">
            <Clock className="h-3.5 w-3.5" />
            <span>{timePercent}% time</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function mapGraphToFlow(
  graph: ProjectGraphResponse,
  theme: ThemeMode,
  viewMode: ViewMode,
  edgeType: EdgeTypeMode,
  edgesVisible: boolean
): { nodes: TaskFlowNode[]; edges: TaskFlowEdge[] } {
  const nodeStatus = new Map(graph.nodes.map((node) => [node.id, node.status]));

  const nodes: TaskFlowNode[] = graph.nodes.map((task, index) => ({
    id: task.id,
    type: 'taskNode',
    position: {
      x: typeof task.positionX === 'number' ? task.positionX : (task.layer ?? index) * 300,
      y: typeof task.positionY === 'number' ? task.positionY : (index % 3) * 220
    },
    data: { task, viewMode, index },
    draggable: true
  }));

  const edges: TaskFlowEdge[] = graph.edges.map((edge) => {
    const targetStatus = nodeStatus.get(edge.targetTaskId) ?? 'AVAILABLE';
    const sourceStatus = nodeStatus.get(edge.sourceTaskId) ?? 'AVAILABLE';
    const visual = getEdgeVisual(theme, sourceStatus, targetStatus);

    return {
      id: edge.id,
      source: edge.sourceTaskId,
      target: edge.targetTaskId,
      type: edgeType,
      animated: visual.animated,
      className: `edge-status-${sourceStatus.toLowerCase()}`,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: visual.color
      },
      style: {
        stroke: visual.color,
        strokeWidth: visual.strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeDasharray: visual.dashArray,
        opacity: edgesVisible ? visual.opacity : 0,
        filter: visual.filter,
        transition: 'stroke 0.3s, stroke-width 0.3s, opacity 0.3s, filter 0.3s',
        animation: edgesVisible ? 'edge-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' : 'none'
      } as React.CSSProperties
    };
  });

  return { nodes, edges };
}

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { theme, toggleTheme } = useTheme();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [graph, setGraph] = useState<ProjectGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('label');
  const [edgeType, setEdgeType] = useState<EdgeTypeMode>('default');
  const [nodes, setNodes, onNodesChange] = useNodesState<TaskFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TaskFlowEdge>([]);
  const [edgesVisible, setEdgesVisible] = useState(true);

  const nodeTypes = useMemo(() => ({ taskNode: TaskNodeCard }), []);

  const graphStats = useMemo(() => {
    const allNodes = graph?.nodes ?? [];
    const completed = allNodes.filter((node) => node.status === 'COMPLETED').length;
    const available = allNodes.filter((node) => node.status === 'AVAILABLE' || node.status === 'IN_PROGRESS').length;
    const estimatedHours = allNodes.reduce((sum, node) => sum + (node.estimatedHours ?? 0), 0);
    const loggedHours = allNodes.reduce((sum, node) => sum + (node.loggedHours ?? 0), 0);

    return {
      tasks: allNodes.length,
      dependencies: graph?.edges.length ?? 0,
      completed,
      available,
      estimatedHours,
      loggedHours,
      completion: allNodes.length ? Math.round((completed / allNodes.length) * 100) : 0
    };
  }, [graph]);

  const loadWorkspace = useCallback(async (showRefresh = false) => {
    if (!projectId) {
      setError('Project id is missing.');
      setLoading(false);
      return;
    }

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const [projectResponse, graphResponse] = await Promise.all([
        projectsApi.getProject(projectId),
        projectsApi.getProjectGraph(projectId)
      ]);
      setProject(projectResponse);
      setGraph(graphResponse);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      setError(parsed.message);
      setProject(null);
      setGraph(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadWorkspace();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (graph) {
      setEdgesVisible(true);
    } else {
      setEdgesVisible(false);
    }
  }, [graph]);

  useEffect(() => {
    if (!graph) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const flow = mapGraphToFlow(graph, theme, viewMode, edgeType, edgesVisible);
    setNodes((currentNodes) => {
      const currentNodeById = new Map(currentNodes.map((node) => [node.id, node]));

      return flow.nodes.map((node) => {
        const currentNode = currentNodeById.get(node.id);

        return {
          ...node,
          position: currentNode?.position ?? node.position,
          selected: currentNode?.selected
        };
      });
    });
    setEdges(flow.edges);
  }, [edgeType, graph, setEdges, setNodes, theme, viewMode, edgesVisible]);

  const activeViewIndex = viewModes.findIndex((mode) => mode.key === viewMode);
  const activeViewOffset = activeViewIndex < 0 ? 0 : activeViewIndex;
  const activeEdgeTypeIndex = edgeTypeModes.findIndex((mode) => mode.key === edgeType);
  const activeEdgeTypeOffset = activeEdgeTypeIndex < 0 ? 0 : activeEdgeTypeIndex;

  return (
    <div className="relative min-h-screen bg-slate-950 light:bg-[#f1f5f9] text-slate-100 light:text-slate-900 flex flex-col font-sans transition-colors duration-300">
      <SafariTopBar />
      <SafariBottomBar />

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 animate-slow-fade hidden md:block">
        <div className="absolute inset-[-30%] h-[160%] w-[160%] animate-[spin_200s_linear_infinite] opacity-[0.85] mix-blend-normal">
          <div className="absolute top-[20%] left-[15%] h-[55vw] min-h-[650px] w-[55vw] min-w-[650px] animate-blob-one rounded-full bg-indigo-600/10 blur-[180px] light:bg-indigo-500/5" />
          <div className="absolute top-[15%] right-[15%] h-[65vw] min-h-[750px] w-[65vw] min-w-[750px] animate-blob-two rounded-full bg-purple-600/8 blur-[200px] light:bg-purple-500/4" />
          <div className="absolute bottom-[20%] left-[20%] h-[55vw] min-h-[650px] w-[55vw] min-w-[650px] animate-blob-three rounded-full bg-blue-600/8 blur-[180px] light:bg-blue-500/4" />
          <div className="absolute bottom-[15%] right-[15%] h-[60vw] min-h-[700px] w-[60vw] min-w-[700px] animate-blob-four rounded-full bg-amber-500/5 blur-[190px] light:bg-amber-400/3" />
        </div>
      </div>

      <svg className="fixed inset-0 z-1 hidden h-full w-full animate-slow-fade mix-blend-overlay opacity-[0.05] pointer-events-none light:opacity-[0.02] md:block">
        <filter id="workspaceNoiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#workspaceNoiseFilter)" />
      </svg>

      <div className={`absolute inset-0 z-0 pointer-events-none md:hidden ${theme === 'light' ? 'light-dashboard-bg-mobile' : 'dashboard-bg-mobile'}`} />
      <div className="md:hidden fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-30 light:from-[#f1f5f9]" />

      <div className="sticky top-0 z-40 h-[88px] w-full pointer-events-none sm:h-24">
        <header className={`w-full pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'py-1.5 sm:py-2' : 'py-3 sm:py-4'} animate-slide-down-fade`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`relative z-50 flex h-14 items-center justify-between rounded-2xl border px-4 shadow-lg backdrop-blur-xl transition-all duration-500 sm:h-16 sm:px-6 ${isScrolled
              ? 'border-brand-500/20 bg-[#020617]/70 shadow-brand-500/5 light:bg-white/75 light:border-brand-500/20'
              : 'border-white/10 bg-[#020617]/70 shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10'
              }`}>
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  to="/"
                  className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 backdrop-blur-md transition-all hover:border-brand-500/30 hover:text-brand-400 light:border-slate-200/80 light:bg-white/[0.07]0 light:text-slate-600 light:hover:text-brand-600"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </Link>

                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <h1 className="truncate text-base font-bold tracking-tight text-white light:text-slate-900 sm:text-lg">
                      {project?.name ?? 'Project Workspace'}
                    </h1>
                    {project && (
                      <span className={`hidden shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-flex ${projectStatusClass[project.status]}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="hidden truncate text-xs text-slate-400 light:text-slate-600 sm:block">
                    Interactive task graph · dependencies and execution flow
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {graph && (
                  <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#020617]/70 px-3 py-2 text-xs font-medium text-slate-400 backdrop-blur-md light:border-slate-200/80 light:bg-white/[0.07]0 light:text-slate-600 md:flex">
                    <Sparkles className="h-3.5 w-3.5 text-brand-400 light:text-brand-600" />
                    <span>Enrichment: {graph.enrichmentStatus}</span>
                  </div>
                )}
                <button
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#020617]/70 text-slate-400 backdrop-blur-md transition-all hover:bg-slate-800/80 hover:text-white active:scale-95 light:border-slate-200/80 light:bg-white/[0.07]0 light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900"
                  aria-label="Toggle theme"
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  {theme === 'light' ? (
                    <Moon className="h-4 w-4 transition-transform duration-500 hover:-rotate-12" />
                  ) : (
                    <Sun className="h-4 w-4 transition-transform duration-500 hover:rotate-90" />
                  )}
                </button>
                <button
                  onClick={() => loadWorkspace(true)}
                  disabled={refreshing || loading}
                  className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-[#020617]/70 px-3 text-xs font-semibold text-slate-400 backdrop-blur-md transition-all hover:bg-slate-800/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:border-slate-200/80 light:bg-white/[0.07]0 light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="relative z-20 mx-auto flex w-full max-w-none flex-1 flex-col gap-4 px-2 pb-4 pt-0 sm:px-3 lg:px-4">
        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-white/10 bg-[#020617]/70 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10 animate-zoom-in-fade">
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-brand-500/20" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              </div>
              <span className="text-sm font-medium text-slate-400 light:text-slate-600 animate-pulse">Loading project graph...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-red-500/20 bg-[#020617]/70 p-6 text-center backdrop-blur-xl shadow-lg shadow-black/10 light:bg-white/75 light:border-red-500/30 light:shadow-slate-200/10 animate-zoom-in-fade">
            <div className="flex max-w-md flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-300 light:text-red-700">Failed to load workspace</h2>
                <p className="mt-1 text-sm text-red-200/80 light:text-red-700/80">{error}</p>
              </div>
              <button
                onClick={() => loadWorkspace()}
                className="rounded-xl border border-white/10 bg-[#020617]/70 backdrop-blur-md px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-slate-800/80 light:bg-white/[0.07]0 light:border-slate-200/80 light:text-red-600 light:hover:bg-slate-50"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <section className="contents">
              <div className="fixed inset-0 z-10 overflow-hidden bg-transparent animate-header-fade-in">
                <div className="workspace-flow-surface absolute inset-0 pointer-events-none" />
                <div className="workspace-flow-vignette absolute inset-0 pointer-events-none" />

                {nodes.length === 0 ? (
                  <div className="relative z-10 flex h-full min-h-dvh items-center justify-center p-8 text-center animate-zoom-in-fade">
                    <div className="max-w-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#020617]/70 text-slate-400 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:text-slate-500 light:shadow-slate-200/10">
                        <ShieldAlert className="h-7 w-7" />
                      </div>
                      <h2 className="mt-4 text-lg font-bold text-white light:text-slate-900">Graph is empty</h2>
                      <p className="mt-2 text-sm text-slate-400 light:text-slate-600">
                        The API returned no tasks for this project yet. Create tasks or trigger AI decomposition to populate the workspace.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ReactFlow<TaskFlowNode, TaskFlowEdge>
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.2}
                    maxZoom={2}
                    proOptions={{ hideAttribution: true }}
                    colorMode={theme}
                    className="taskgraph-flow bg-transparent [&_.react-flow__attribution]:!bg-slate-900/70 [&_.react-flow__attribution]:!text-slate-500 light:[&_.react-flow__attribution]:!bg-white/80 light:[&_.react-flow__attribution]:!text-slate-500"
                  >
                    <Background
                      color={theme === 'light' ? 'rgba(100,116,139,0.26)' : 'rgba(148,163,184,0.18)'}
                      gap={22}
                      size={0.9}
                      className="opacity-35 light:opacity-30"
                    />
                    <MiniMap
                      position="bottom-left"
                      zoomable
                      pannable
                      nodeStrokeWidth={3}
                      bgColor="transparent"
                      className="taskgraph-corner-minimap hidden md:block !mb-[64px] !ml-4 !rounded-2xl border border-white/10 !bg-[#020617]/70 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:!bg-white/75 light:shadow-slate-200/10 [&_.react-flow__minimap-mask]:!stroke-white/10 light:[&_.react-flow__minimap-mask]:!stroke-slate-200 animate-slide-up-fade [animation-delay:150ms]"
                      nodeColor={(node) => {
                        const taskNode = node as TaskFlowNode;
                        const status = taskNode.data.task.status;

                        if (status === 'IN_PROGRESS') return theme === 'light' ? 'rgba(245, 158, 11, 0.75)' : 'rgba(251, 191, 36, 0.8)';
                        if (status === 'COMPLETED') return theme === 'light' ? 'rgba(16, 185, 129, 0.75)' : 'rgba(52, 211, 153, 0.8)';
                        if (status === 'LOCKED') return theme === 'light' ? 'rgba(148, 163, 184, 0.45)' : 'rgba(71, 85, 105, 0.55)';
                        return theme === 'light' ? 'rgba(79, 70, 229, 0.55)' : 'rgba(99, 102, 241, 0.7)';
                      }}
                      maskColor={theme === 'light' ? 'rgba(241, 245, 249, 0.5)' : 'rgba(2, 6, 23, 0.6)'}
                      style={{ width: 140, height: 100 }}
                    />
                    <Controls
                      position="bottom-left"
                      orientation="horizontal"
                      className="taskgraph-corner-controls !mb-4 !ml-4 overflow-hidden !rounded-2xl border border-white/10 !bg-[#020617]/70 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:!bg-white/75 light:shadow-slate-200/10 animate-slide-up-fade [animation-delay:150ms]"
                    />

                    <Panel position="bottom-center" className="!mb-6 hidden lg:block">
                      <div className="flex items-stretch gap-3 animate-slide-up-fade [animation-delay:250ms]">

                        <div className="rounded-full border border-white/10 bg-[#020617]/70 p-1.5 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10">
                          <div className="relative grid grid-cols-3 items-stretch gap-1 h-full" role="tablist">
                            <span
                              className={`absolute inset-y-0 left-0 w-[calc((100%-0.5rem)/3)] rounded-full bg-gradient-to-r from-brand-500 to-orange-500 shadow-md shadow-brand-500/20 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeViewOffset === 0
                                ? 'translate-x-0'
                                : activeViewOffset === 1
                                  ? 'translate-x-[calc(100%+0.25rem)]'
                                  : 'translate-x-[calc(200%+0.5rem)]'
                                }`}
                            />
                            {viewModes.map(({ key, label, icon: Icon }) => {
                              const active = viewMode === key;
                              return (
                                <button
                                  key={key}
                                  onClick={() => setViewMode(key)}
                                  className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold whitespace-nowrap transition-colors duration-300 ease-out cursor-pointer ${active
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900'
                                    }`}
                                >
                                  <Icon className="h-4 w-4" />
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-full border border-white/10 bg-[#020617]/70 p-1.5 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10">
                          <div className="relative grid grid-cols-4 items-stretch gap-1 h-full" role="tablist">
                            <span
                              className={`absolute inset-y-0 left-0 w-[calc((100%-0.75rem)/4)] rounded-full bg-gradient-to-r from-brand-500 to-orange-500 shadow-md shadow-brand-500/20 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeEdgeTypeOffset === 0
                                ? 'translate-x-0'
                                : activeEdgeTypeOffset === 1
                                  ? 'translate-x-[calc(100%+0.25rem)]'
                                  : activeEdgeTypeOffset === 2
                                    ? 'translate-x-[calc(200%+0.5rem)]'
                                    : 'translate-x-[calc(300%+0.75rem)]'
                                }`}
                            />
                            {edgeTypeModes.map(({ key, label, icon: Icon }) => {
                              const active = edgeType === key;
                              return (
                                <button
                                  key={key}
                                  onClick={() => setEdgeType(key)}
                                  className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold whitespace-nowrap transition-colors duration-300 ease-out cursor-pointer ${active
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900'
                                    }`}
                                >
                                  <Icon className="h-4 w-4" />
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </Panel>

                    <Panel position="bottom-right" className="!mb-6 !mr-6 hidden lg:block">
                      <div className="flex items-center gap-4 rounded-full border border-white/10 bg-[#020617]/70 p-1.5 pr-6 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10 animate-slide-up-fade [animation-delay:350ms]">
                        <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500/15 to-orange-500/15 px-4 py-2 text-[12px] font-bold whitespace-nowrap text-brand-300 light:text-brand-700">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{graphStats.completion}% complete</span>
                        </div>

                        <div className="h-5 w-px bg-white/10 light:bg-slate-200" />

                        <div className="flex items-center gap-5 text-[12px] font-semibold whitespace-nowrap text-slate-300 light:text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Network className="h-4 w-4 text-brand-400 light:text-brand-500" />
                            <span>{graphStats.tasks} tasks</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <GitBranch className="h-4 w-4 text-sky-400 light:text-sky-500" />
                            <span>{graphStats.dependencies} deps</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-amber-400 light:text-amber-500" />
                            <span>{graphStats.available} open</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-violet-400 light:text-violet-500" />
                            <span>{graphStats.loggedHours}h / {graphStats.estimatedHours}h</span>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  </ReactFlow>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
