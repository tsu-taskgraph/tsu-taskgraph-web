import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
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
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock,
  GitBranch,
  Hourglass,
  Layers3,
  Loader2,
  Lock,
  Network,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserRound,
  Users,
  Zap
} from 'lucide-react';
import { projectsApi, type ProjectGraphResponse, type ProjectResponse, type TaskNode } from '../api/projects';
import { mapServerErrorToEnglish } from '../api/errors';
import { useTheme } from '../context/ThemeContext';
import { SafariTopBar } from '../components/SafariTopBar';
import { SafariBottomBar } from '../components/SafariBottomBar';

type TaskFlowNodeData = {
  task: TaskNode;
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
    nodeClass: 'border-slate-700/70 bg-slate-900/85 light:bg-white/80 light:border-slate-200 opacity-75',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200',
    dotClass: 'bg-slate-500',
    edge: '#64748b'
  },
  AVAILABLE: {
    label: 'Available',
    icon: Zap,
    nodeClass: 'border-amber-500/35 bg-slate-900/90 shadow-amber-500/10 light:bg-white/90 light:border-amber-500/35 light:shadow-amber-500/10',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25 light:bg-amber-500/15 light:text-amber-700 light:border-amber-500/30',
    dotClass: 'bg-amber-400',
    edge: '#f59e0b'
  },
  IN_PROGRESS: {
    label: 'In progress',
    icon: Hourglass,
    nodeClass: 'border-sky-500/35 bg-slate-900/90 shadow-sky-500/10 light:bg-white/90 light:border-sky-500/35 light:shadow-sky-500/10',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/25 light:bg-sky-500/15 light:text-sky-700 light:border-sky-500/30',
    dotClass: 'bg-sky-400',
    edge: '#38bdf8'
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    nodeClass: 'border-emerald-500/35 bg-slate-900/90 shadow-emerald-500/10 light:bg-white/90 light:border-emerald-500/35 light:shadow-emerald-500/10',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 light:bg-emerald-500/15 light:text-emerald-700 light:border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    edge: '#10b981'
  },
  SKIPPED: {
    label: 'Skipped',
    icon: CircleDashed,
    nodeClass: 'border-violet-500/35 bg-slate-900/80 shadow-violet-500/10 light:bg-white/85 light:border-violet-500/35 light:shadow-violet-500/10 opacity-80',
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

const projectStatusClass: Record<ProjectResponse['status'], string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 light:bg-emerald-500/15 light:text-emerald-700 light:border-emerald-500/30',
  COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20 light:bg-blue-500/15 light:text-blue-700 light:border-blue-500/30',
  ARCHIVED: 'bg-slate-500/10 text-slate-400 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200',
  PENDING_AI: 'bg-amber-500/10 text-amber-400 border-amber-500/20 light:bg-amber-500/15 light:text-amber-700 light:border-amber-500/30'
};

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function formatDate(date: string | null | undefined) {
  if (!date) return 'Not set';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function getTaskProgress(task: TaskNode) {
  if (typeof task.completionPercent === 'number') return task.completionPercent;
  if (task.status === 'COMPLETED') return 100;
  if (task.status === 'IN_PROGRESS') return 50;
  return 0;
}

function TaskNodeCard({ data, selected }: NodeProps<TaskFlowNode>) {
  const task = data.task;
  const status = statusConfig[task.status] ?? statusConfig.AVAILABLE;
  const StatusIcon = status.icon;
  const progress = getTaskProgress(task);
  const assignees = task.assignees ?? [];
  const category = task.category ?? 'OTHER';

  return (
    <div
      className={`group relative w-[270px] overflow-hidden rounded-2xl border backdrop-blur-xl shadow-xl shadow-black/20 transition-all duration-300 ${status.nodeClass} ${selected
        ? 'scale-[1.02] border-brand-400/70 shadow-brand-500/20 light:border-brand-500/70 light:shadow-brand-500/15'
        : 'hover:-translate-y-0.5 hover:border-brand-500/35 light:hover:border-brand-500/40'
        }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-slate-950 !bg-brand-400 light:!border-white light:!bg-brand-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-slate-950 !bg-brand-400 light:!border-white light:!bg-brand-500"
      />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent light:via-slate-300/80" />
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-brand-500/10 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-lg ${status.dotClass}`} />
            <h3 className="line-clamp-2 text-sm font-bold leading-snug tracking-tight text-slate-100 light:text-slate-900">
              {task.title}
            </h3>
          </div>
          <span className={`shrink-0 rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${status.badgeClass}`}>
            <StatusIcon className="mr-1 inline h-3 w-3" />
            {status.label}
          </span>
        </div>

        {task.description && (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-400 light:text-slate-600">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${categoryConfig[category]}`}>
            {category}
          </span>
          {typeof task.estimatedHours === 'number' && (
            <span className="rounded-md border border-white/5 bg-slate-800/60 px-2 py-0.5 text-[9px] font-semibold text-slate-300 light:border-slate-200 light:bg-slate-100 light:text-slate-600">
              {task.estimatedHours}h est.
            </span>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium text-slate-400 light:text-slate-500">
            <span>Progress</span>
            <span className="font-bold text-slate-100 light:text-slate-900">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80 light:bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3 light:border-slate-200/70">
          <div className="flex -space-x-2 overflow-hidden">
            {assignees.length > 0 ? assignees.slice(0, 3).map((assignee) => (
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
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-700 bg-slate-800/50 text-slate-500 light:border-slate-300 light:bg-slate-100/70">
                <UserRound className="h-3.5 w-3.5" />
              </div>
            )}
            {assignees.length > 3 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-950 bg-brand-500/15 text-[9px] font-bold text-brand-300 light:border-white light:text-brand-700">
                +{assignees.length - 3}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 light:text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{task.loggedHours ?? 0}h logged</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function mapGraphToFlow(graph: ProjectGraphResponse): { nodes: TaskFlowNode[]; edges: TaskFlowEdge[] } {
  const nodeStatus = new Map(graph.nodes.map((node) => [node.id, node.status]));

  const nodes: TaskFlowNode[] = graph.nodes.map((task, index) => ({
    id: task.id,
    type: 'taskNode',
    position: {
      x: typeof task.positionX === 'number' ? task.positionX : (task.layer ?? index) * 300,
      y: typeof task.positionY === 'number' ? task.positionY : (index % 3) * 220
    },
    data: { task },
    draggable: true
  }));

  const edges: TaskFlowEdge[] = graph.edges.map((edge) => {
    const targetStatus = nodeStatus.get(edge.targetTaskId) ?? 'AVAILABLE';
    const sourceStatus = nodeStatus.get(edge.sourceTaskId) ?? 'AVAILABLE';
    const color = sourceStatus === 'COMPLETED' ? statusConfig[targetStatus].edge : 'rgba(148, 163, 184, 0.55)';

    return {
      id: edge.id,
      source: edge.sourceTaskId,
      target: edge.targetTaskId,
      type: 'smoothstep',
      animated: targetStatus === 'AVAILABLE' || targetStatus === 'IN_PROGRESS',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color
      },
      style: {
        stroke: color,
        strokeWidth: 2.2
      }
    };
  });

  return { nodes, edges };
}

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { theme } = useTheme();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [graph, setGraph] = useState<ProjectGraphResponse | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<TaskFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TaskFlowEdge>([]);

  const nodeTypes = useMemo(() => ({ taskNode: TaskNodeCard }), []);

  const selectedTask = useMemo(() => {
    if (!graph) return null;
    return graph.nodes.find((node) => node.id === selectedTaskId) ?? graph.nodes[0] ?? null;
  }, [graph, selectedTaskId]);

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
      setSelectedTaskId((current) => current ?? graphResponse.nodes[0]?.id ?? null);
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
    if (!graph) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const flow = mapGraphToFlow(graph);
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [graph, setEdges, setNodes]);

  return (
    <div className="relative min-h-screen bg-slate-950 light:bg-[#f1f5f9] text-slate-100 light:text-slate-900 flex flex-col font-sans transition-colors duration-300">
      <SafariTopBar />
      <SafariBottomBar />

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 animate-slow-fade hidden md:block">
        <div className="absolute inset-[-30%] h-[160%] w-[160%] animate-[spin_220s_linear_infinite] opacity-[0.85] mix-blend-normal">
          <div className="absolute top-[18%] left-[10%] h-[55vw] min-h-[650px] w-[55vw] min-w-[650px] animate-blob-one rounded-full bg-indigo-600/10 blur-[180px] light:bg-indigo-500/5" />
          <div className="absolute top-[20%] right-[12%] h-[60vw] min-h-[700px] w-[60vw] min-w-[700px] animate-blob-two rounded-full bg-purple-600/8 blur-[200px] light:bg-purple-500/4" />
          <div className="absolute bottom-[15%] left-[20%] h-[55vw] min-h-[650px] w-[55vw] min-w-[650px] animate-blob-three rounded-full bg-blue-600/8 blur-[180px] light:bg-blue-500/4" />
          <div className="absolute bottom-[10%] right-[18%] h-[60vw] min-h-[700px] w-[60vw] min-w-[700px] animate-blob-four rounded-full bg-amber-500/5 blur-[190px] light:bg-amber-400/3" />
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
        <header className={`w-full pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'py-1.5 sm:py-2' : 'py-3 sm:py-4'}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`relative z-50 flex h-14 items-center justify-between rounded-2xl border px-4 shadow-lg backdrop-blur-xl transition-all duration-500 sm:h-16 sm:px-6 ${isScrolled
              ? 'border-brand-500/20 bg-[#020617]/70 shadow-brand-500/5 light:bg-white/70 light:border-brand-500/20'
              : 'border-white/10 bg-[#020617]/70 shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10'
              }`}>
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  to="/"
                  className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 text-slate-300 transition-all hover:border-brand-500/30 hover:text-brand-400 light:border-slate-200 light:bg-white light:text-slate-600 light:hover:text-brand-600"
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
                  <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-xs font-medium text-slate-400 light:border-slate-200 light:bg-white/60 light:text-slate-600 md:flex">
                    <Sparkles className="h-3.5 w-3.5 text-brand-400 light:text-brand-600" />
                    <span>Enrichment: {graph.enrichmentStatus}</span>
                  </div>
                )}
                <button
                  onClick={() => loadWorkspace(true)}
                  disabled={refreshing || loading}
                  className="flex h-9 items-center gap-2 rounded-xl border border-slate-700/50 px-3 text-xs font-semibold text-slate-400 transition-all hover:bg-slate-800/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:border-slate-200 light:text-slate-600 light:hover:bg-slate-100 light:hover:text-slate-900"
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
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl light:border-slate-200/80 light:bg-white/60">
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-brand-500/20" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              </div>
              <span className="text-sm font-medium text-slate-400 light:text-slate-600 animate-pulse">Loading project graph...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-center backdrop-blur-xl light:bg-red-500/10">
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
                className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 light:text-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <section className="contents">
              <div className="fixed inset-0 z-10 overflow-hidden bg-slate-950 light:bg-[#f1f5f9]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_30%)] pointer-events-none" />

                {nodes.length === 0 ? (
                  <div className="relative z-10 flex h-full min-h-dvh items-center justify-center p-8 text-center">
                    <div className="max-w-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-slate-400 light:border-slate-200 light:bg-white light:text-slate-500">
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
                    onNodeClick={(_event, node) => setSelectedTaskId(node.id)}
                    fitView
                    fitViewOptions={{ padding: 0.12, minZoom: 0.78, maxZoom: 1.12 }}
                    minZoom={0.35}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                    className="taskgraph-flow"
                  >
                    <Background
                      variant={BackgroundVariant.Dots}
                      gap={22}
                      size={1.4}
                      color={theme === 'light' ? '#cbd5e1' : '#334155'}
                    />
                    <MiniMap
                      zoomable
                      pannable
                      nodeStrokeWidth={3}
                      className="hidden md:block lg:!mr-[400px]"
                      nodeColor={(node) => {
                        const taskNode = node as TaskFlowNode;
                        return statusConfig[taskNode.data.task.status]?.edge ?? '#f59e0b';
                      }}
                      maskColor={theme === 'light' ? 'rgba(241, 245, 249, 0.68)' : 'rgba(2, 6, 23, 0.68)'}
                    />
                    <Controls position="bottom-left" className="!mb-4 !ml-4" />
                    <Panel position="top-left" className="!ml-4 !mt-[104px] hidden sm:block">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/75 px-3 py-2 text-xs font-medium text-slate-300 shadow-lg backdrop-blur-xl light:border-slate-200 light:bg-white/80 light:text-slate-600">
                        Drag nodes to inspect layout · click a card for details
                      </div>
                    </Panel>

                    <Panel position="bottom-center" className="!mb-4 hidden sm:block lg:!mr-[400px]">
                      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 shadow-2xl shadow-black/25 backdrop-blur-xl light:border-slate-200 light:bg-white/85 light:shadow-slate-200/30">
                        <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500/15 to-orange-500/15 px-3 py-1.5 text-xs font-bold text-brand-300 light:text-brand-700">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{graphStats.completion}% complete</span>
                        </div>
                        <div className="hidden h-6 w-px bg-white/10 light:bg-slate-200 md:block" />
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 light:text-slate-600">
                          <Network className="h-3.5 w-3.5 text-brand-400 light:text-brand-600" />
                          <span>{graphStats.tasks} tasks</span>
                        </div>
                        <div className="hidden items-center gap-2 text-xs font-semibold text-slate-300 light:text-slate-600 md:flex">
                          <GitBranch className="h-3.5 w-3.5 text-sky-400 light:text-sky-600" />
                          <span>{graphStats.dependencies} deps</span>
                        </div>
                        <div className="hidden items-center gap-2 text-xs font-semibold text-slate-300 light:text-slate-600 lg:flex">
                          <Zap className="h-3.5 w-3.5 text-amber-400 light:text-amber-600" />
                          <span>{graphStats.available} open</span>
                        </div>
                        <div className="hidden items-center gap-2 text-xs font-semibold text-slate-300 light:text-slate-600 xl:flex">
                          <Clock className="h-3.5 w-3.5 text-violet-400 light:text-violet-600" />
                          <span>{graphStats.loggedHours}h / {graphStats.estimatedHours}h</span>
                        </div>
                      </div>
                    </Panel>
                  </ReactFlow>
                )}
              </div>

              <aside className="relative z-30 mt-[72dvh] flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl light:border-slate-200/80 light:bg-white/85 light:shadow-slate-200/30 lg:fixed lg:bottom-4 lg:right-4 lg:top-28 lg:mt-0 lg:w-[380px] lg:overflow-y-auto">
                {selectedTask ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className={`inline-flex rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusConfig[selectedTask.status].badgeClass}`}>
                          {statusConfig[selectedTask.status].label}
                        </span>
                        <h2 className="mt-3 text-xl font-bold tracking-tight text-white light:text-slate-900">{selectedTask.title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400 light:text-slate-600">
                          {selectedTask.description || 'No task description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3 light:border-slate-200/70 light:bg-slate-50/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</span>
                        <p className="mt-1 text-sm font-semibold text-slate-200 light:text-slate-800">{selectedTask.category ?? 'OTHER'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3 light:border-slate-200/70 light:bg-slate-50/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Layer</span>
                        <p className="mt-1 text-sm font-semibold text-slate-200 light:text-slate-800">{selectedTask.layer ?? 'Auto'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3 light:border-slate-200/70 light:bg-slate-50/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimate</span>
                        <p className="mt-1 text-sm font-semibold text-slate-200 light:text-slate-800">{selectedTask.estimatedHours ?? 0}h</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3 light:border-slate-200/70 light:bg-slate-50/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Logged</span>
                        <p className="mt-1 text-sm font-semibold text-slate-200 light:text-slate-800">{selectedTask.loggedHours ?? 0}h</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 light:border-slate-200/70 light:bg-slate-50/70">
                      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400 light:text-slate-500">
                        <span>Task progress</span>
                        <span className="font-bold text-white light:text-slate-900">{getTaskProgress(selectedTask)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800 light:bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-orange-500"
                          style={{ width: `${getTaskProgress(selectedTask)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 light:border-slate-200/70 light:bg-slate-50/70">
                        <div className="flex items-center gap-2 text-sm font-bold text-white light:text-slate-900">
                          <Users className="h-4 w-4 text-brand-400 light:text-brand-600" />
                          Assignees
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(selectedTask.assignees ?? []).length > 0 ? selectedTask.assignees.map((assignee) => (
                            <div key={assignee.userId} className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900/70 px-2.5 py-2 light:border-slate-200 light:bg-white">
                              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-brand-500/10 text-[10px] font-bold text-brand-300 light:text-brand-700">
                                {assignee.avatarUrl ? <img src={assignee.avatarUrl} alt={assignee.displayName} className="h-full w-full object-cover" /> : getInitials(assignee.displayName)}
                              </div>
                              <span className="text-xs font-medium text-slate-300 light:text-slate-700">{assignee.displayName}</span>
                            </div>
                          )) : (
                            <span className="text-sm text-slate-500">No assignees yet.</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 light:border-slate-200/70 light:bg-slate-50/70">
                        <div className="flex items-center gap-2 text-sm font-bold text-white light:text-slate-900">
                          <Layers3 className="h-4 w-4 text-sky-400 light:text-sky-600" />
                          Schedule
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-400 light:text-slate-600">
                          <div className="flex justify-between gap-4">
                            <span>Start date</span>
                            <span className="font-semibold text-slate-200 light:text-slate-800">{formatDate(selectedTask.startDate)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span>Due date</span>
                            <span className="font-semibold text-slate-200 light:text-slate-800">{formatDate(selectedTask.dueDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedTask.enrichment && (
                      <div className="flex flex-col gap-3">
                        {selectedTask.enrichment.checklist.length > 0 && (
                          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 light:border-slate-200/70 light:bg-slate-50/70">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-white light:text-slate-900">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 light:text-emerald-600" />
                              Checklist
                            </h3>
                            <ul className="mt-3 space-y-2">
                              {selectedTask.enrichment.checklist.map((item) => (
                                <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-400 light:text-slate-600">
                                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400 light:text-brand-600" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedTask.enrichment.pitfalls.length > 0 && (
                          <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4 light:border-amber-500/20 light:bg-amber-500/10">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-amber-300 light:text-amber-700">
                              <AlertCircle className="h-4 w-4" />
                              Pitfalls
                            </h3>
                            <ul className="mt-3 space-y-2">
                              {selectedTask.enrichment.pitfalls.map((item) => (
                                <li key={item} className="text-xs leading-relaxed text-amber-100/80 light:text-amber-800/80">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedTask.enrichment.links.length > 0 && (
                          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 light:border-slate-200/70 light:bg-slate-50/70">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-white light:text-slate-900">
                              <BookOpen className="h-4 w-4 text-blue-400 light:text-blue-600" />
                              Docs
                            </h3>
                            <div className="mt-3 flex flex-col gap-2">
                              {selectedTask.enrichment.links.map((link) => (
                                <a
                                  key={`${link.title}-${link.url}`}
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2 text-xs font-medium text-blue-300 transition-colors hover:border-blue-500/20 hover:bg-blue-500/10 light:border-slate-200 light:bg-white light:text-blue-700 light:hover:bg-blue-50"
                                >
                                  {link.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-slate-400 light:border-slate-200 light:bg-white light:text-slate-500">
                      <Loader2 className="h-7 w-7" />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-white light:text-slate-900">Select a task</h2>
                    <p className="mt-2 max-w-xs text-sm text-slate-400 light:text-slate-600">
                      Click any custom node on the ReactFlow canvas to inspect status, assignees, estimates and enrichment details.
                    </p>
                  </div>
                )}
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
