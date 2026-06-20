import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Moon,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sun,
} from 'lucide-react';
import { projectsApi, type ProjectResponse, type ProjectGraphResponse, type TaskNode } from '../api/projects';
import { mapServerErrorToEnglish } from '../api/errors';
import { useTheme } from '../context/ThemeContext';
import { SafariTopBar } from '../components/SafariTopBar';
import { SafariBottomBar } from '../components/SafariBottomBar';
import {
  mapGraphToFlow,
  type ViewMode,
  type EdgeTypeMode,
  type WorkspaceNode,
  type TaskFlowEdge,
  type TaskFlowNode,
} from '../utils/workspaceUtils';
import { TaskNodeCard } from '../components/workspace/TaskNodeCard';
import { LayerHeaderNode } from '../components/workspace/LayerHeaderNode';
import { TopologicalLanesHeader } from '../components/workspace/TopologicalLanesHeader';
import { WorkspaceToolbar } from '../components/workspace/WorkspaceToolbar';

type TaskCategory = NonNullable<TaskNode['category']>;

type TaskDraftPosition = {
  flow: { x: number; y: number };
  screen: { x: number; y: number };
};

type TaskCreatorMode = 'context' | 'toolbar';

const taskCategories: TaskCategory[] = ['BACKEND', 'FRONTEND', 'DEVOPS', 'TESTING', 'DOCUMENTATION', 'DESIGN', 'OTHER'];

const taskCategoryTagClass: Record<TaskCategory, string> = {
  BACKEND: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 light:bg-indigo-500/10 light:text-indigo-700 light:border-indigo-500/20',
  FRONTEND: 'bg-pink-500/10 text-pink-300 border-pink-500/20 light:bg-pink-500/10 light:text-pink-700 light:border-pink-500/20',
  DEVOPS: 'bg-orange-500/10 text-orange-300 border-orange-500/20 light:bg-orange-500/10 light:text-orange-700 light:border-orange-500/20',
  TESTING: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 light:bg-emerald-500/10 light:text-emerald-700 light:border-emerald-500/20',
  DOCUMENTATION: 'bg-blue-500/10 text-blue-300 border-blue-500/20 light:bg-blue-500/10 light:text-blue-700 light:border-blue-500/20',
  DESIGN: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20 light:bg-fuchsia-500/10 light:text-fuchsia-700 light:border-fuchsia-500/20',
  OTHER: 'bg-slate-500/10 text-slate-300 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200'
};

const taskFormFieldClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-brand-500 light:focus:ring-brand-500';

const projectStatusClass: Record<ProjectResponse['status'], string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 light:bg-emerald-500/15 light:text-emerald-700 light:border-emerald-500/30',
  COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20 light:bg-blue-500/15 light:text-blue-700 light:border-blue-500/30',
  ARCHIVED: 'bg-slate-500/10 text-slate-400 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200',
  PENDING_AI: 'bg-amber-500/10 text-amber-400 border-amber-500/20 light:bg-amber-500/15 light:text-amber-700 light:border-amber-500/30'
};

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
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkspaceNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TaskFlowEdge>([]);
  const [edgesVisible, setEdgesVisible] = useState(true);
  const [showTopologicalLanes, setShowTopologicalLanes] = useState(false);
  const [isAligned, setIsAligned] = useState(true);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<WorkspaceNode, TaskFlowEdge> | null>(null);
  const [taskDraftPosition, setTaskDraftPosition] = useState<TaskDraftPosition | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('OTHER');
  const [taskHours, setTaskHours] = useState('0.0');
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [taskFieldErrors, setTaskFieldErrors] = useState<{ title?: string; hours?: string }>({});
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskCreatorMode, setTaskCreatorMode] = useState<TaskCreatorMode>('context');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [taskCreatorAnimationKey, setTaskCreatorAnimationKey] = useState(0);

  const nodeTypes = useMemo(() => ({
    taskNode: (props: any) => <TaskNodeCard {...props} theme={theme} />,
    layerHeader: LayerHeaderNode
  }), [theme]);

  const handleNodeDrag = useCallback((_event: any, node: any) => {
    if (node.type !== 'taskNode') return;

    setIsAligned(false);

    setNodes((prevNodes) => {
      const tasksByLayer = new Map<number, WorkspaceNode[]>();
      prevNodes.forEach((n) => {
        if (n.type === 'taskNode') {
          const taskNode = n as TaskFlowNode;
          const layer = taskNode.data.task.layer ?? 0;
          if (!tasksByLayer.has(layer)) {
            tasksByLayer.set(layer, []);
          }
          tasksByLayer.get(layer)!.push(n);
        }
      });

      return prevNodes.map((n) => {
        if (n.type === 'layerHeader') {
          const layerNum = Number((n.data as any).label);
          const nodesInLayer = tasksByLayer.get(layerNum) ?? [];
          if (nodesInLayer.length > 0) {
            const sumX = nodesInLayer.reduce((sum, taskNode) => sum + taskNode.position.x, 0);
            const avgX = sumX / nodesInLayer.length;
            const centerOffset = viewMode === 'dot' ? 22 : viewMode === 'label' ? 146 : 159;
            return {
              ...n,
              position: {
                x: avgX + centerOffset,
                y: n.position.y
              }
            };
          }
        }
        return n;
      });
    });
  }, [setNodes, viewMode]);

  const autoArrangeLayout = useCallback(() => {
    if (!graph) return;
    const flow = mapGraphToFlow(graph, theme, viewMode, edgeType, edgesVisible, showTopologicalLanes);
    setNodes(flow.nodes);
    setIsAligned(true);
  }, [graph, theme, viewMode, edgeType, edgesVisible, showTopologicalLanes, setNodes]);

  const openTaskCreator = useCallback((screenX?: number, screenY?: number, mode: TaskCreatorMode = 'context') => {
    const fallbackScreen = {
      x: Math.round(window.innerWidth / 2),
      y: Math.round(window.innerHeight / 2)
    };
    const screen = {
      x: screenX ?? fallbackScreen.x,
      y: screenY ?? fallbackScreen.y
    };
    const flow = flowInstance?.screenToFlowPosition(screen) ?? { x: 0, y: 0 };

    const maxPopoverX = Math.max(12, window.innerWidth - 372);
    const maxPopoverY = Math.max(96, window.innerHeight - 432);

    setTaskCreatorMode(mode);
    setTaskCreatorAnimationKey((key) => key + 1);
    setCategoryDropdownOpen(false);
    setTaskDraftPosition({
      screen: {
        x: Math.min(Math.max(screen.x, 12), maxPopoverX),
        y: Math.min(Math.max(screen.y, 96), maxPopoverY)
      },
      flow: {
        x: Math.round(flow.x),
        y: Math.round(flow.y)
      }
    });
    setTaskFormError(null);
    setTaskFieldErrors({});
  }, [flowInstance]);

  const closeTaskCreator = useCallback(() => {
    if (creatingTask) return;
    setTaskDraftPosition(null);
    setTaskFormError(null);
    setTaskFieldErrors({});
    setCategoryDropdownOpen(false);
  }, [creatingTask]);

  const handlePaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
    event.preventDefault();
    openTaskCreator(event.clientX, event.clientY);
  }, [openTaskCreator]);

  const parseHoursValue = useCallback((value: string): number | null => {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return null;

    if (normalized.includes(':')) {
      const [hoursPart, minutesPart = '0'] = normalized.split(':');
      const hours = Number(hoursPart || 0);
      const minutes = Number(minutesPart || 0);

      if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
        return Number.NaN;
      }

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

      if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
        return '0.0';
      }

      return `${Math.floor(hours)}:${String(Math.floor(minutes)).padStart(2, '0')}`;
    }

    const parsed = Number(normalized);
    return formatDecimalHours(parsed);
  }, [formatDecimalHours]);

  const maskHoursValue = useCallback((value: string) => {
    const normalized = value.replace(',', '.');

    if (normalized.includes(':')) {
      const [rawHours = '', rawMinutes = ''] = normalized.split(':');
      const hours = rawHours.replace(/\D/g, '').slice(0, 4);
      const minutes = rawMinutes.replace(/\D/g, '').slice(0, 2);
      return `${hours || '0'}:${minutes}`;
    }

    const cleaned = normalized
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1');

    const [rawInteger = '', rawDecimal] = cleaned.split('.');
    const integerPart = rawInteger.replace(/^0+(?=\d)/, '') || '0';

    if (rawDecimal !== undefined) {
      return `${integerPart}.${rawDecimal.slice(0, 2)}`;
    }

    return integerPart;
  }, []);

  const updateHoursByStep = useCallback((direction: 1 | -1) => {
    setTaskHours((current) => {
      const parsed = parseHoursValue(current);
      const next = Math.max(0, (parsed !== null && Number.isFinite(parsed) ? parsed : 0) + direction * 0.25);
      return formatDecimalHours(next);
    });
    setTaskFormError(null);
    setTaskFieldErrors((prev) => ({ ...prev, hours: undefined }));
  }, [formatDecimalHours, parseHoursValue]);

  const createTask = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!projectId || !taskDraftPosition) return;

    const title = taskTitle.trim();
    const normalizedHours = parseHoursValue(taskHours);
    const nextFieldErrors: { title?: string; hours?: string } = {};

    if (!title) {
      nextFieldErrors.title = 'Task title is required.';
    }

    if (normalizedHours !== null && (!Number.isFinite(normalizedHours) || normalizedHours < 0)) {
      nextFieldErrors.hours = 'Enter valid hours.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setTaskFieldErrors(nextFieldErrors);
      setTaskFormError(null);
      return;
    }

    setCreatingTask(true);
    setTaskFormError(null);
    setTaskFieldErrors({});

    try {
      const createdTask = await projectsApi.createTask(projectId, {
        title,
        description: taskDescription.trim() || null,
        category: taskCategory,
        estimatedHours: normalizedHours,
        positionX: taskDraftPosition.flow.x,
        positionY: taskDraftPosition.flow.y
      });

      const createdNode: TaskFlowNode = {
        id: createdTask.id,
        type: 'taskNode',
        position: {
          x: createdTask.positionX ?? taskDraftPosition.flow.x,
          y: createdTask.positionY ?? taskDraftPosition.flow.y
        },
        data: { task: createdTask, viewMode, index: graph?.nodes.length ?? nodes.length },
        draggable: true,
        selected: true
      };

      setNodes((currentNodes) => [
        ...currentNodes.map((node) => ({ ...node, selected: false })),
        createdNode
      ]);
      setGraph((currentGraph) => currentGraph ? {
        ...currentGraph,
        nodes: [...currentGraph.nodes, createdTask]
      } : currentGraph);
      setProject((currentProject) => currentProject ? {
        ...currentProject,
        totalEstimatedHours: (currentProject.totalEstimatedHours ?? 0) + (createdTask.estimatedHours ?? 0),
        updatedAt: createdTask.updatedAt
      } : currentProject);
      setIsAligned(false);
      setTaskDraftPosition(null);
      setTaskTitle('');
      setTaskDescription('');
      setTaskCategory('OTHER');
      setTaskHours('0.0');
      setTaskFieldErrors({});
      setCategoryDropdownOpen(false);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      setTaskFormError(parsed.message);
    } finally {
      setCreatingTask(false);
    }
  }, [graph?.nodes.length, nodes.length, parseHoursValue, projectId, setNodes, taskCategory, taskDescription, taskDraftPosition, taskHours, taskTitle, viewMode]);

  const graphStats = useMemo(() => {
    const allNodes = graph?.nodes ?? [];
    const completed = allNodes.filter((node: TaskNode) => node.status === 'COMPLETED').length;
    const available = allNodes.filter((node: TaskNode) => node.status === 'AVAILABLE' || node.status === 'IN_PROGRESS').length;
    const estimatedHours = allNodes.reduce((sum: number, node: TaskNode) => sum + (node.estimatedHours ?? 0), 0);
    const loggedHours = allNodes.reduce((sum: number, node: TaskNode) => sum + (node.loggedHours ?? 0), 0);

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
      setIsAligned(false);
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
    setIsAligned(false);
  }, [viewMode]);

  useEffect(() => {
    if (!graph) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const flow = mapGraphToFlow(graph, theme, viewMode, edgeType, edgesVisible, showTopologicalLanes);
    setNodes((currentNodes) => {
      const currentNodeById = new Map(currentNodes.map((node) => [node.id, node]));

      return flow.nodes.map((node) => {
        const currentNode = currentNodeById.get(node.id);
        const useNewPosition = node.type === 'layerHeader';

        return {
          ...node,
          position: useNewPosition ? node.position : (currentNode?.position ?? node.position),
          selected: currentNode?.selected
        };
      });
    });
    setEdges(flow.edges);
  }, [edgeType, graph, setEdges, setNodes, theme, viewMode, edgesVisible, showTopologicalLanes]);

  const uniqueLayers = useMemo(() => {
    if (!graph) return [];
    const layers = Array.from(new Set(graph.nodes.map((n: TaskNode) => n.layer).filter((l): l is number => typeof l === 'number'))) as number[];
    return layers.sort((a, b) => a - b);
  }, [graph]);

  const categoryDropdownOpensUp = Boolean(
    taskDraftPosition &&
    typeof window !== 'undefined' &&
    taskDraftPosition.screen.y > window.innerHeight - 520
  );

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
        <header className={`w-full pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'py-1.5 sm:py-2' : 'py-3 sm:py-4'}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`relative z-50 flex h-14 items-center justify-between rounded-2xl border px-4 shadow-lg backdrop-blur-xl transition-all duration-500 sm:h-16 sm:px-6 animate-slide-down-fade ${isScrolled
              ? 'border-brand-500/20 bg-[#020617]/70 shadow-brand-500/5 light:bg-white/75 light:border-brand-500/20'
              : 'border-white/10 bg-[#020617]/70 shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10'
              }`}>
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  to="/"
                  className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#020617]/45 text-slate-300 backdrop-blur-xl transition-all hover:border-brand-500/30 hover:text-brand-400 light:border-slate-200/60 light:bg-white/45 light:text-slate-600 light:hover:text-brand-600"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </Link>

                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <h1 className="truncate text-base font-bold tracking-tight text-white light:text-slate-900 sm:text-lg max-w-[120px] sm:max-w-[280px] md:max-w-[420px] lg:max-w-[600px]" title={project?.name}>
                      {project?.name
                        ? (project.name.length > 80 ? `${project.name.slice(0, 80)}...` : project.name)
                        : 'Project Workspace'}
                    </h1>
                    {project && (
                      <span className={`hidden shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-flex ${projectStatusClass[project.status]}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="hidden truncate text-xs text-slate-400 light:text-slate-600 sm:block max-w-[180px] sm:max-w-[280px] md:max-w-[420px] lg:max-w-[600px]">
                    {project?.description
                      ? (project.description.length > 120 ? `${project.description.slice(0, 120)}...` : project.description)
                      : 'Interactive task graph · dependencies and execution flow'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {graph && (
                  <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#020617]/45 px-3 py-2 text-xs font-medium text-slate-400 backdrop-blur-xl light:border-slate-200/60 light:bg-white/45 light:text-slate-600 lg:flex">
                    <Sparkles className="h-3.5 w-3.5 text-brand-400 light:text-brand-600" />
                    <span>Enrichment: {graph.enrichmentStatus}</span>
                  </div>
                )}
                <button
                  onClick={() => loadWorkspace(true)}
                  disabled={refreshing || loading}
                  className="flex h-9 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 text-xs font-semibold text-slate-400 backdrop-blur-xl transition-all hover:bg-slate-800/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:border-slate-200/60 light:bg-white/45 light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900 w-9 lg:w-auto px-0 lg:px-3 shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden lg:inline">Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-950/45 text-slate-400 backdrop-blur-xl transition-all hover:bg-slate-800/80 hover:text-white active:scale-95 cursor-pointer light:border-slate-200/60 light:bg-white/45 light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900 group shrink-0"
                  aria-label="Toggle theme"
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  {theme === 'light' ? (
                    <Moon className="w-3.5 h-3.5 transition-transform duration-500 rotate-0 group-hover:-rotate-12 group-hover:scale-110" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 transition-transform duration-500 rotate-0 group-hover:rotate-90 group-hover:scale-110" />
                  )}
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
                className="rounded-xl border border-white/10 bg-[#020617]/70 backdrop-blur-md px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-slate-800/80 light:bg-slate-100/80 light:border-slate-200/80 light:text-red-600 light:hover:bg-slate-50"
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

                {!graph ? (
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
                  <ReactFlowProvider>
                    <ReactFlow<WorkspaceNode, TaskFlowEdge>
                      nodes={nodes}
                      edges={edges}
                      nodeTypes={nodeTypes}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onNodeDrag={handleNodeDrag}
                      onNodeDragStop={handleNodeDrag}
                      onInit={setFlowInstance}
                      onPaneContextMenu={handlePaneContextMenu}
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
                        className="taskgraph-corner-minimap !hidden lg:!block !mb-[66px] !ml-4 !rounded-2xl border border-white/10 !bg-[#020617]/70 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:!bg-white/75 light:shadow-slate-200/10 [&_.react-flow__minimap-mask]:!stroke-white/10 light:[&_.react-flow__minimap-mask]:!stroke-slate-200 animate-slide-up-fade [animation-delay:150ms]"
                        nodeColor={(node) => {
                          if (node.type === 'layerHeader') return 'transparent';
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
                        className="taskgraph-corner-controls !hidden lg:!flex !mb-6 !ml-4 overflow-hidden !rounded-2xl border border-white/10 !bg-[#020617]/70 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:!bg-white/75 light:shadow-slate-200/10 animate-slide-up-fade [animation-delay:150ms]"
                      />
                      <WorkspaceToolbar
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        edgeType={edgeType}
                        setEdgeType={setEdgeType}
                        showTopologicalLanes={showTopologicalLanes}
                        setShowTopologicalLanes={setShowTopologicalLanes}
                        isAligned={isAligned}
                        autoArrangeLayout={autoArrangeLayout}
                        onCreateTask={() => openTaskCreator(undefined, undefined, 'toolbar')}
                        graphStats={graphStats}
                      />
                      {taskDraftPosition && (
                        <>
                          {taskCreatorMode === 'toolbar' && (
                            <div
                              className="fixed inset-0 z-[60] animate-slow-fade bg-slate-950/20 backdrop-blur-[1px] light:bg-slate-900/5"
                              onPointerDown={closeTaskCreator}
                              aria-hidden="true"
                            />
                          )}
                          <div
                            key={`${taskCreatorMode}-${taskCreatorAnimationKey}`}
                            className={`fixed z-[70] animate-zoom-in-fade rounded-3xl p-4 text-slate-100 shadow-2xl backdrop-blur-2xl light:text-slate-900 ${taskCreatorMode === 'toolbar'
                              ? 'w-[min(420px,calc(100vw-1.5rem))] border border-white/10 bg-[#020617]/75 shadow-black/10 light:border-slate-200/60 light:bg-white/80 light:shadow-slate-200/20'
                              : 'w-[min(360px,calc(100vw-1.5rem))] border border-white/10 bg-[#020617]/85 shadow-black/25 light:border-slate-200/70 light:bg-white/90 light:shadow-slate-300/30'
                              }`}
                            style={taskCreatorMode === 'toolbar'
                              ? { left: 'max(12px, calc(50vw - 210px))', top: 'max(112px, calc(50vh - 270px))' }
                              : { left: taskDraftPosition.screen.x, top: taskDraftPosition.screen.y }
                            }
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-300 light:text-brand-700">
                                  <Plus className="h-3 w-3" />
                                  {taskCreatorMode === 'toolbar' ? 'Create task' : 'New task'}
                                </div>
                                <p className="mt-2 text-xs text-slate-400 light:text-slate-600">
                                  {taskCreatorMode === 'toolbar'
                                    ? 'Create a task from the toolbar. It will be placed in the center of the current canvas view.'
                                    : 'Fill in the details and create a node on the graph.'}
                                </p>
                              </div>

                            </div>

                            <form className="space-y-3" onSubmit={createTask}>
                              <div>
                                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 light:text-slate-500">
                                    Title
                                  </label>
                                  {taskFieldErrors.title && (
                                    <span className="animate-error-pop text-right text-[10px] font-medium leading-none text-red-400">{taskFieldErrors.title}</span>
                                  )}
                                </div>
                                <input
                                  value={taskTitle}
                                  onChange={(event) => {
                                    setTaskTitle(event.target.value);
                                    setTaskFormError(null);
                                    setTaskFieldErrors((prev) => ({ ...prev, title: undefined }));
                                  }}
                                  autoFocus
                                  placeholder="e.g. Build task creation UI"
                                  className={`${taskFormFieldClass} ${taskFieldErrors.title ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                  disabled={creatingTask}
                                />
                              </div>

                              <div>
                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500 light:text-slate-500">
                                  Description
                                </label>
                                <textarea
                                  value={taskDescription}
                                  onChange={(event) => setTaskDescription(event.target.value)}
                                  placeholder="Short task details"
                                  rows={3}
                                  className={`${taskFormFieldClass} resize-none`}
                                  disabled={creatingTask}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500 light:text-slate-500">
                                    Category
                                  </label>
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => !creatingTask && setCategoryDropdownOpen((open) => !open)}
                                      className={`${taskFormFieldClass} flex items-center justify-between gap-2 font-semibold`}
                                      disabled={creatingTask}
                                      aria-haspopup="listbox"
                                      aria-expanded={categoryDropdownOpen}
                                    >
                                      <span className={`max-w-[calc(100%-1.5rem)] truncate rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${taskCategoryTagClass[taskCategory]}`}>
                                        {taskCategory}
                                      </span>
                                      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {categoryDropdownOpen && (
                                      <div
                                        className={`absolute left-0 right-0 z-[90] max-h-[min(19rem,calc(100vh-8rem))] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/85 p-1.5 shadow-xl backdrop-blur-xl animate-dropdown-slide light:border-slate-200/80 light:bg-white/95 light:shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08)] [scrollbar-width:thin] ${categoryDropdownOpensUp ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'}`}
                                        role="listbox"
                                      >
                                        {taskCategories.map((category) => {
                                          const active = taskCategory === category;
                                          return (
                                            <button
                                              key={category}
                                              type="button"
                                              onMouseDown={(event) => {
                                                event.preventDefault();
                                                setTaskCategory(category);
                                                setCategoryDropdownOpen(false);
                                              }}
                                              className={`flex w-full items-center px-2.5 py-2 text-left transition-colors duration-200 cursor-pointer rounded-lg ${active
                                                ? 'bg-white/5 light:bg-slate-50'
                                                : 'hover:bg-white/5 light:hover:bg-slate-50'
                                                }`}
                                              role="option"
                                              aria-selected={active}
                                            >
                                              <span className={`rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${taskCategoryTagClass[category]}`}>
                                                {category}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 light:text-slate-500">
                                      Hours
                                    </label>
                                    {taskFieldErrors.hours && (
                                      <span className="animate-error-pop text-right text-[10px] font-medium leading-none text-red-400">{taskFieldErrors.hours}</span>
                                    )}
                                  </div>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      inputMode="text"
                                      value={taskHours}
                                      placeholder="1.5 or 1:30"
                                      onChange={(event) => {
                                        setTaskHours(maskHoursValue(event.target.value));
                                        setTaskFormError(null);
                                        setTaskFieldErrors((prev) => ({ ...prev, hours: undefined }));
                                      }}
                                      onFocus={(event) => event.target.select()}
                                      onBlur={() => setTaskHours((current) => formatHoursValue(current))}
                                      className={`${taskFormFieldClass} pr-9 font-semibold tabular-nums ${taskFieldErrors.hours ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                      disabled={creatingTask}
                                    />
                                    <div className="absolute inset-y-1.5 right-1.5 flex w-6 flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-900/70 light:border-slate-200/80 light:bg-slate-50">
                                      <button
                                        type="button"
                                        onClick={() => updateHoursByStep(1)}
                                        disabled={creatingTask}
                                        className="flex flex-1 items-center justify-center text-slate-400 transition hover:bg-white/5 hover:text-brand-300 disabled:opacity-50 light:text-slate-500 light:hover:bg-white light:hover:text-brand-600"
                                        aria-label="Increase estimated hours"
                                      >
                                        <ChevronUp className="h-3 w-3" />
                                      </button>
                                      <div className="h-px bg-white/10 light:bg-slate-200" />
                                      <button
                                        type="button"
                                        onClick={() => updateHoursByStep(-1)}
                                        disabled={creatingTask}
                                        className="flex flex-1 items-center justify-center text-slate-400 transition hover:bg-white/5 hover:text-brand-300 disabled:opacity-50 light:text-slate-500 light:hover:bg-white light:hover:text-brand-600"
                                        aria-label="Decrease estimated hours"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {taskFormError && (
                                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 light:text-red-700">
                                  {taskFormError}
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={closeTaskCreator}
                                  disabled={creatingTask}
                                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-200 disabled:opacity-50 light:text-slate-600 light:hover:bg-slate-950/5 light:hover:text-slate-900"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={creatingTask}
                                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition hover:shadow-brand-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {creatingTask ? 'Creating...' : 'Create'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </>
                      )}

                      <TopologicalLanesHeader
                        show={showTopologicalLanes}
                        columnWidth={400}
                        viewMode={viewMode}
                        uniqueLayers={uniqueLayers}
                        nodes={nodes}
                      />
                    </ReactFlow>
                  </ReactFlowProvider>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}