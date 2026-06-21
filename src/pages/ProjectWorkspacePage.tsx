import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { AlertCircle, GitBranch, ShieldAlert, Plus, X } from 'lucide-react';
import { projectsApi, type ProjectGraphResponse, type TaskNode, type UpdateTaskRequest } from '../api/projects';
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
  type TaskCreatorMode,
  type TaskDraftPosition
} from '../utils/workspaceUtils';
import { TaskNodeCard } from '../components/workspace/TaskNodeCard';
import { LayerHeaderNode } from '../components/workspace/LayerHeaderNode';
import { TopologicalLanesHeader } from '../components/workspace/TopologicalLanesHeader';
import { WorkspaceToolbar } from '../components/workspace/WorkspaceToolbar';
import { WorkspaceHeader } from '../components/workspace/WorkspaceHeader';
import { TaskCreator } from '../components/workspace/TaskCreator';
import { TaskDetailsSidebar } from '../components/workspace/TaskDetailsSidebar';
import { TaskStatusMenu } from '../components/workspace/TaskStatusMenu';
import { TaskActionsModal } from '../components/workspace/TaskActionsModal';
import { ConfirmModal } from '../components/workspace/ConfirmModal';
import { mapServerErrorToEnglish } from '../api/errors';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useWorkspaceCopyPaste } from '../hooks/useWorkspaceCopyPaste';
import { useWorkspaceConnections } from '../hooks/useWorkspaceConnections';
import { useWorkspaceLoader } from '../hooks/useWorkspaceLoader';
import { useWorkspaceLayout } from '../hooks/useWorkspaceLayout';

const isEditableShortcutTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
};

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('label');
  const [edgeType, setEdgeType] = useState<EdgeTypeMode>('default');
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkspaceNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TaskFlowEdge>([]);
  const [edgesVisible, setEdgesVisible] = useState(true);
  const [showTopologicalLanes, setShowTopologicalLanes] = useState(false);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<WorkspaceNode, TaskFlowEdge> | null>(null);
  const [taskDraftPosition, setTaskDraftPosition] = useState<TaskDraftPosition | null>(null);
  const [taskCreatorMode, setTaskCreatorMode] = useState<TaskCreatorMode>('context');
  const [taskCreatorAnimationKey, setTaskCreatorAnimationKey] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [edgeToast, setEdgeToast] = useState<{ id: number; message: string; variant: 'error' | 'success'; closing: boolean } | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [isTaskSidebarClosing, setIsTaskSidebarClosing] = useState(false);
  const taskSidebarCloseTimerRef = useRef<number | null>(null);
  const suppressTaskSidebarSelectionRef = useRef(false);
  const lastTaskNodeClickAtRef = useRef(0);
  const [statusUpdatingTaskId, setStatusUpdatingTaskId] = useState<string | null>(null);
  const [statusMenu, setStatusMenu] = useState<{ taskId: string; screen: { x: number; y: number } } | null>(null);

  const [taskActionsModalTaskId, setTaskActionsModalTaskId] = useState<string | null>(null);
  const [isActionsModalClosing, setIsActionsModalClosing] = useState(false);
  const [actionsModalAnimationKey, setActionsModalAnimationKey] = useState(0);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);
  const [isConfirmClosing, setIsConfirmClosing] = useState(false);

  const {
    takeSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    updateCurrentState
  } = useUndoRedo<WorkspaceNode, TaskFlowEdge, ProjectGraphResponse>();

  const closeEdgeToast = useCallback((id?: number) => {
    setEdgeToast((current) => {
      if (!current || (id && current.id !== id)) return current;
      return { ...current, closing: true };
    });

    window.setTimeout(() => {
      setEdgeToast((current) => {
        if (!current || (id && current.id !== id)) return current;
        return null;
      });
    }, 220);
  }, []);

  const showEdgeToast = useCallback((message: string, variant: 'error' | 'success' = 'error') => {
    const id = Date.now();
    setEdgeToast({ id, message, variant, closing: false });
    window.setTimeout(() => closeEdgeToast(id), 4300);
  }, [closeEdgeToast]);

  const {
    project,
    setProject,
    graph,
    setGraph,
    loading,
    refreshing,
    error,
    loadWorkspace
  } = useWorkspaceLoader({ projectId });

  const {
    isAligned,
    setIsAligned,
    handleNodeDragStart,
    handleNodeDrag,
    autoArrangeLayout
  } = useWorkspaceLayout({
    graph,
    nodes,
    setNodes,
    theme,
    viewMode,
    edgeType,
    edgesVisible,
    showTopologicalLanes,
    takeSnapshot,
  });

  const {
    connectionHint,
    handleConnect,
    handleConnectStart,
    handleConnectEnd,
    isValidConnection,
    handleReconnectStart,
    handleReconnect,
    handleReconnectEnd
  } = useWorkspaceConnections({
    projectId,
    graph,
    setGraph,
    takeSnapshot,
    showEdgeToast,
    loadWorkspace
  });

  const {
    copySelectedTasks,
    pasteCopiedTasks
  } = useWorkspaceCopyPaste({
    projectId,
    nodes,
    setNodes,
    graph,
    setGraph,
    setProject,
    viewMode,
    flowInstance,
    takeSnapshot,
    showEdgeToast
  });

  useEffect(() => {
    updateCurrentState(nodes, edges, graph);
  }, [nodes, edges, graph, updateCurrentState]);

  useEffect(() => {
    if (refreshing) {
      setIsAligned(false);
    }
  }, [refreshing, setIsAligned]);

  useEffect(() => {
    setIsAligned(false);
  }, [viewMode, setIsAligned]);

  const nodeTypes = useMemo(() => ({
    taskNode: (props: any) => <TaskNodeCard {...props} theme={theme} />,
    layerHeader: LayerHeaderNode
  }), [theme]);



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

    setStatusMenu(null);
    setTaskCreatorMode(mode);
    setTaskCreatorAnimationKey((key) => key + 1);
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
  }, [flowInstance]);

  const closeTaskCreator = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setTaskDraftPosition(null);
      setIsClosing(false);
    }, 200);
  }, []);

  const openTaskActionsModal = useCallback((taskId: string) => {
    setStatusMenu(null);
    setTaskDraftPosition(null);
    setActionsModalAnimationKey((key) => key + 1);
    setTaskActionsModalTaskId(taskId);
  }, []);

  const closeTaskActionsModal = useCallback(() => {
    setIsActionsModalClosing(true);
    setTimeout(() => {
      setTaskActionsModalTaskId(null);
      setIsActionsModalClosing(false);
    }, 200);
  }, []);

  const handlePaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
    event.preventDefault();
    openTaskCreator(event.clientX, event.clientY);
  }, [openTaskCreator]);

  const cancelTaskDetailsSidebarClose = useCallback(() => {
    if (taskSidebarCloseTimerRef.current !== null) {
      window.clearTimeout(taskSidebarCloseTimerRef.current);
      taskSidebarCloseTimerRef.current = null;
    }
    suppressTaskSidebarSelectionRef.current = false;
    setIsTaskSidebarClosing(false);
    setIsTaskSidebarOpen(true);
  }, []);

  const closeSidebarOnly = useCallback(() => {
    if (!isTaskSidebarOpen || taskSidebarCloseTimerRef.current !== null) return;

    setIsTaskSidebarClosing(true);
    taskSidebarCloseTimerRef.current = window.setTimeout(() => {
      setIsTaskSidebarOpen(false);
      setIsTaskSidebarClosing(false);
      taskSidebarCloseTimerRef.current = null;
    }, 140);
  }, [isTaskSidebarOpen]);

  const closeTaskDetailsSidebar = useCallback(() => {
    if (!selectedTaskId || taskSidebarCloseTimerRef.current !== null) return;

    suppressTaskSidebarSelectionRef.current = true;
    setIsTaskSidebarClosing(true);
    setNodes((currentNodes): WorkspaceNode[] => currentNodes.map((node) => (
      node.type === 'taskNode' && node.id === selectedTaskId
        ? { ...node, selected: false }
        : node
    )));

    taskSidebarCloseTimerRef.current = window.setTimeout(() => {
      setSelectedTaskId(null);
      setIsTaskSidebarOpen(false);
      setIsTaskSidebarClosing(false);
      taskSidebarCloseTimerRef.current = null;
      suppressTaskSidebarSelectionRef.current = false;
    }, 140);
  }, [selectedTaskId, setNodes]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: WorkspaceNode) => {
    if (node.type === 'taskNode') {
      lastTaskNodeClickAtRef.current = Date.now();
      cancelTaskDetailsSidebarClose();
      setSelectedTaskId(node.id);
    }
  }, [cancelTaskDetailsSidebarClose]);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: WorkspaceNode) => {
    if (node.type !== 'taskNode') return;
    event.preventDefault();
    event.stopPropagation();
    lastTaskNodeClickAtRef.current = Date.now();

    suppressTaskSidebarSelectionRef.current = true;
    setSelectedTaskId(node.id);
    setNodes((currentNodes): WorkspaceNode[] => currentNodes.map((n) => ({
      ...n,
      selected: n.type === 'taskNode' && n.id === node.id
    })));

    if (isTaskSidebarOpen) {
      closeSidebarOnly();
    }

    setTaskDraftPosition(null);
    setStatusMenu({
      taskId: node.id,
      screen: {
        x: event.clientX,
        y: event.clientY
      }
    });

    setTimeout(() => {
      suppressTaskSidebarSelectionRef.current = false;
    }, 50);
  }, [closeSidebarOnly, isTaskSidebarOpen, setNodes]);

  const handlePaneClick = useCallback(() => {
    closeTaskCreator();
    closeTaskDetailsSidebar();
    setStatusMenu(null);
    closeTaskActionsModal();
  }, [closeTaskCreator, closeTaskDetailsSidebar, closeTaskActionsModal]);

  const handleSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: WorkspaceNode[] }) => {
    const selectedTaskNode = selectedNodes.find((node) => node.type === 'taskNode');

    if (suppressTaskSidebarSelectionRef.current) {
      return;
    }

    if (selectedTaskNode) {
      cancelTaskDetailsSidebarClose();
      setSelectedTaskId(selectedTaskNode.id);
      return;
    }

    if (Date.now() - lastTaskNodeClickAtRef.current < 120) {
      return;
    }

    closeTaskDetailsSidebar();
  }, [cancelTaskDetailsSidebarClose, closeTaskDetailsSidebar]);

  useEffect(() => {
    return () => {
      if (taskSidebarCloseTimerRef.current !== null) {
        window.clearTimeout(taskSidebarCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableShortcutTarget(event.target)) return;
      const isModifierPressed = event.metaKey || event.ctrlKey;
      if (!isModifierPressed) return;

      const key = event.key.toLowerCase();
      if (key === 'c') {
        event.preventDefault();
        copySelectedTasks();
      }
      if (key === 'v') {
        event.preventDefault();
        void pasteCopiedTasks();
      }
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo(setNodes, setEdges, setGraph);
        } else {
          undo(setNodes, setEdges, setGraph);
        }
      }
      if (key === 'y') {
        event.preventDefault();
        redo(setNodes, setEdges, setGraph);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copySelectedTasks, pasteCopiedTasks, undo, redo, setNodes, setEdges, setGraph]);

  const handleTaskCreated = useCallback((createdTask: TaskNode) => {
    if (!taskDraftPosition) return;
    takeSnapshot();

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
  }, [graph?.nodes.length, nodes.length, taskDraftPosition, viewMode, setNodes, takeSnapshot]);

  const graphStats = useMemo(() => {
    const allNodes = graph?.nodes ?? [];
    const completed = allNodes.filter((node: TaskNode) => node.status === 'COMPLETED').length;
    const available = allNodes.filter((node: TaskNode) => node.status === 'AVAILABLE' || node.status === 'IN_PROGRESS').length;
    const estimatedHours = allNodes.reduce((sum: number, node: TaskNode) => sum + (node.estimatedHours ?? 0), 0);
    const loggedHours = allNodes.reduce((sum: number, node: TaskNode) => sum + (node.loggedHours ?? 0), 0);
    const averageCompletion = allNodes.length
      ? Math.round(allNodes.reduce((sum: number, node: TaskNode) => sum + (node.completionPercent ?? 0), 0) / allNodes.length)
      : 0;

    return {
      tasks: allNodes.length,
      dependencies: graph?.edges.length ?? 0,
      completed,
      available,
      estimatedHours,
      loggedHours,
      completion: averageCompletion
    };
  }, [graph]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return graph?.nodes.find((task) => task.id === selectedTaskId) ?? null;
  }, [graph?.nodes, selectedTaskId]);

  const statusMenuTask = useMemo(() => {
    if (!statusMenu?.taskId) return null;
    return graph?.nodes.find((task) => task.id === statusMenu.taskId) ?? null;
  }, [graph?.nodes, statusMenu?.taskId]);

  const taskActionsModalTask = useMemo(() => {
    if (!taskActionsModalTaskId) return null;
    return graph?.nodes.find((task) => task.id === taskActionsModalTaskId) ?? null;
  }, [graph?.nodes, taskActionsModalTaskId]);

  const handleTaskUpdate = useCallback(async (data: {
    title?: string;
    description?: string | null;
    category?: TaskNode['category'];
    estimatedHours?: number | null;
    completionPercent?: number | null;
    status?: TaskNode['status'];
    startDate?: string | null;
    dueDate?: string | null;
  }) => {
    if (!selectedTask) return;

    takeSnapshot();
    setStatusUpdatingTaskId(selectedTask.id);

    try {
      let updatedTask = selectedTask;

      if (data.status && data.status !== selectedTask.status && data.status !== 'LOCKED') {
        const statusRes = await projectsApi.updateTaskStatus(selectedTask.id, {
          status: data.status as 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED',
          loggedHours: null
        });
        updatedTask = statusRes.updatedTask;

        if (statusRes.unlockedTasks && statusRes.unlockedTasks.length > 0) {
          const unlockedMap = new Map(statusRes.unlockedTasks.map((t) => [t.id, t]));
          setGraph((currentGraph) => currentGraph ? {
            ...currentGraph,
            nodes: currentGraph.nodes.map((t) => unlockedMap.get(t.id) ?? (t.id === updatedTask.id ? updatedTask : t))
          } : currentGraph);
          setNodes((currentNodes): WorkspaceNode[] => currentNodes.map((node) => {
            if (node.type !== 'taskNode') return node;
            const ut = unlockedMap.get(node.id) ?? (node.id === updatedTask.id ? updatedTask : null);
            if (!ut) return node;
            const taskNode = node as TaskFlowNode;
            return {
              ...taskNode,
              data: {
                ...taskNode.data,
                task: ut
              }
            };
          }));
        }
      }

      const updateData: UpdateTaskRequest = {
        title: data.title,
        description: data.description,
        category: data.category,
        estimatedHours: data.estimatedHours,
        completionPercent: data.completionPercent,
        startDate: data.startDate,
        dueDate: data.dueDate
      };

      const finalTask = await projectsApi.updateTask(selectedTask.id, updateData);

      setGraph((currentGraph) => currentGraph ? {
        ...currentGraph,
        nodes: currentGraph.nodes.map((task) => task.id === finalTask.id ? finalTask : task)
      } : currentGraph);
      setNodes((currentNodes): WorkspaceNode[] => currentNodes.map((node) => {
        if (node.type !== 'taskNode' || node.id !== finalTask.id) return node;
        const taskNode = node as TaskFlowNode;
        return {
          ...taskNode,
          data: {
            ...taskNode.data,
            task: finalTask
          }
        };
      }));
      showEdgeToast('Task details updated.', 'success');
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      showEdgeToast(parsed.message);
    } finally {
      setStatusUpdatingTaskId(null);
    }
  }, [selectedTask, setNodes, setGraph, showEdgeToast, takeSnapshot]);

  const handleLogTaskTime = useCallback(async (task: TaskNode, data: { hours?: number | null; comment?: string | null; completionPercent?: number | null }) => {
    takeSnapshot();
    setStatusUpdatingTaskId(task.id);

    try {
      let updatedTask: TaskNode = { ...task };

      if (data.hours && data.hours > 0) {
        await projectsApi.logTaskTime(task.id, { hours: data.hours, comment: data.comment || null });
        updatedTask.loggedHours = (task.loggedHours ?? 0) + data.hours;
      }

      if (typeof data.completionPercent === 'number') {
        const response = await projectsApi.updateTask(task.id, { completionPercent: data.completionPercent });
        updatedTask = {
          ...updatedTask,
          ...response,
          loggedHours: data.hours && data.hours > 0 ? (task.loggedHours ?? 0) + data.hours : response.loggedHours
        };
      }

      setGraph((currentGraph) => currentGraph ? {
        ...currentGraph,
        nodes: currentGraph.nodes.map((item) => item.id === updatedTask.id ? updatedTask : item)
      } : currentGraph);
      setNodes((currentNodes): WorkspaceNode[] => currentNodes.map((node) => {
        if (node.type !== 'taskNode' || node.id !== updatedTask.id) return node;
        const taskNode = node as TaskFlowNode;
        return {
          ...taskNode,
          data: {
            ...taskNode.data,
            task: updatedTask
          }
        };
      }));
      showEdgeToast('Task updated successfully.', 'success');
      setStatusMenu(null);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      showEdgeToast(parsed.message);
    } finally {
      setStatusUpdatingTaskId(null);
    }
  }, [setGraph, setNodes, showEdgeToast, takeSnapshot]);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (!selectedTask) return;

    setConfirmModal({
      title: 'Delete task?',
      message: `Are you sure you want to delete "${selectedTask.title}"?\nThis action cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        setIsConfirmClosing(true);
        setTimeout(() => {
          setConfirmModal(null);
          setIsConfirmClosing(false);
        }, 200);
        setStatusUpdatingTaskId(taskId);

        try {
          await projectsApi.deleteTask(taskId);

          setGraph((currentGraph) => currentGraph ? {
            ...currentGraph,
            nodes: currentGraph.nodes.filter((t) => t.id !== taskId)
          } : currentGraph);

          setNodes((currentNodes) => currentNodes.filter((n) => n.id !== taskId));

          if (selectedTaskId === taskId) {
            closeTaskDetailsSidebar();
          }

          showEdgeToast('Task deleted successfully.', 'success');
        } catch (err) {
          const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
          const parsed = mapServerErrorToEnglish(err, statusCode);
          showEdgeToast(parsed.message);
        } finally {
          setStatusUpdatingTaskId(null);
        }
      }
    });
  }, [selectedTask, selectedTaskId, takeSnapshot, setGraph, setNodes, closeTaskDetailsSidebar, showEdgeToast]);

  const handleTaskStatusChange = useCallback(async (
    status: 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED',
    data?: { loggedHours?: number | null; comment?: string | null; completionPercent?: number | null }
  ) => {
    if (!selectedTask) return;

    takeSnapshot();
    setStatusUpdatingTaskId(selectedTask.id);

    try {
      const response = await projectsApi.updateTaskStatus(selectedTask.id, {
        status,
        loggedHours: data?.loggedHours ?? null,
        comment: data?.comment ?? null
      });

      const updatedMainTask = typeof data?.completionPercent === 'number'
        ? await projectsApi.updateTask(response.updatedTask.id, { completionPercent: data.completionPercent })
        : response.updatedTask;
      const updatedTasks = [updatedMainTask, ...(response.unlockedTasks ?? [])];
      const updatedTaskById = new Map(updatedTasks.map((task) => [task.id, task]));

      setGraph((currentGraph) => currentGraph ? {
        ...currentGraph,
        nodes: currentGraph.nodes.map((task) => updatedTaskById.get(task.id) ?? task)
      } : currentGraph);

      setNodes((currentNodes): WorkspaceNode[] => currentNodes.map((node) => {
        if (node.type !== 'taskNode') return node;
        const updatedTask = updatedTaskById.get(node.id);
        if (!updatedTask) return node;

        const taskNode = node as TaskFlowNode;
        const updatedNode: TaskFlowNode = {
          ...taskNode,
          data: {
            ...taskNode.data,
            task: updatedTask
          }
        };

        return updatedNode;
      }));

      showEdgeToast(
        response.unlockedTasks?.length
          ? `Task updated. ${response.unlockedTasks.length} task${response.unlockedTasks.length === 1 ? '' : 's'} unlocked.`
          : 'Task status updated.',
        'success'
      );
      setStatusMenu(null);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      showEdgeToast(parsed.message);
    } finally {
      setStatusUpdatingTaskId(null);
    }
  }, [selectedTask, setNodes, showEdgeToast, takeSnapshot, setGraph]);

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

    const flow = mapGraphToFlow(graph, theme, viewMode, edgeType, edgesVisible, showTopologicalLanes);
    setNodes((currentNodes) => {
      const currentNodeById = new Map(currentNodes.map((node) => [node.id, node]));
      const useNewPosition = (nodeType: string | undefined) => nodeType === 'layerHeader';

      return flow.nodes.map((node) => {
        const currentNode = currentNodeById.get(node.id);

        return {
          ...node,
          position: useNewPosition(node.type) ? node.position : (currentNode?.position ?? node.position),
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

      <WorkspaceHeader
        project={project}
        graph={graph}
        loading={loading}
        refreshing={refreshing}
        theme={theme}
        toggleTheme={toggleTheme}
        onRefresh={() => loadWorkspace(true)}
        isScrolled={isScrolled}
      />

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

                {!graph || graph.nodes.length === 0 ? (
                  <div className="relative z-10 flex h-full min-h-dvh items-center justify-center p-8 text-center animate-zoom-in-fade">
                    <div className="max-w-sm flex flex-col items-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#020617]/70 text-slate-400 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:text-slate-500 light:shadow-slate-200/10">
                        <ShieldAlert className="h-7 w-7" />
                      </div>
                      <h2 className="mt-4 text-lg font-bold text-white light:text-slate-900">Graph is empty</h2>
                      <p className="mt-2 text-sm text-slate-400 light:text-slate-600">
                        The API returned no tasks for this project yet. Create tasks or trigger AI decomposition to populate the workspace.
                      </p>
                      <button
                        onClick={() => openTaskCreator(undefined, undefined, 'toolbar')}
                        className="group relative mt-6 flex items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r from-brand-500 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/15 transition-all duration-300 hover:scale-[1.03] hover:shadow-brand-500/25 hover:brightness-110 active:scale-95 cursor-pointer"
                      >
                        <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-brand-500 to-orange-500 opacity-10 blur-[2px] transition-opacity duration-300 group-hover:opacity-20 pointer-events-none" />
                        <Plus className="relative z-10 h-4 w-4 shrink-0" />
                        <span className="relative z-10">Create First Task</span>
                      </button>
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
                      onConnect={handleConnect}
                      onConnectStart={handleConnectStart}
                      onConnectEnd={handleConnectEnd}
                      onReconnect={handleReconnect}
                      onReconnectStart={handleReconnectStart}
                      onReconnectEnd={handleReconnectEnd}
                      isValidConnection={isValidConnection}
                      connectionLineStyle={connectionHint?.variant === 'error'
                        ? { stroke: '#ef4444', strokeWidth: 2.6, strokeDasharray: '6 6' }
                        : connectionHint?.variant === 'success'
                          ? { stroke: '#22c55e', strokeWidth: 2.6 }
                          : { stroke: theme === 'light' ? '#d97706' : '#f59e0b', strokeWidth: 2.2 }
                      }
                      onNodeClick={handleNodeClick}
                      onNodeContextMenu={handleNodeContextMenu}
                      onSelectionChange={handleSelectionChange}
                      onNodeDragStart={handleNodeDragStart}
                      onNodeDrag={handleNodeDrag}
                      onNodeDragStop={handleNodeDrag}
                      onInit={setFlowInstance}
                      onPaneContextMenu={handlePaneContextMenu}
                      onPaneClick={handlePaneClick}
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
                        onTaskActions={() => {
                          if (selectedTaskId) {
                            openTaskActionsModal(selectedTaskId);
                          }
                        }}
                        onDeleteTask={() => {
                          if (selectedTaskId) {
                            handleDeleteTask(selectedTaskId);
                          }
                        }}
                        graphStats={graphStats}
                        undo={() => undo(setNodes, setEdges, setGraph)}
                        redo={() => redo(setNodes, setEdges, setGraph)}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        isTaskSidebarOpen={isTaskSidebarOpen}
                        isTaskSelected={Boolean(selectedTaskId) && !statusMenu}
                      />
                      {taskDraftPosition && projectId && (
                        <TaskCreator
                          projectId={projectId}
                          taskDraftPosition={taskDraftPosition}
                          mode={taskCreatorMode}
                          isClosing={isClosing}
                          onClose={closeTaskCreator}
                          onTaskCreated={handleTaskCreated}
                          animationKey={taskCreatorAnimationKey}
                        />
                      )}

                      {isTaskSidebarOpen && selectedTask && (
                        <TaskDetailsSidebar
                          task={selectedTask}
                          onClose={closeSidebarOnly}
                          onTaskUpdate={handleTaskUpdate}
                          onInteract={() => setStatusMenu(null)}
                          updating={statusUpdatingTaskId === selectedTask.id}
                          isClosing={isTaskSidebarClosing}
                        />
                      )}

                      {taskActionsModalTask && (
                        <TaskActionsModal
                          task={taskActionsModalTask}
                          isClosing={isActionsModalClosing}
                          onClose={closeTaskActionsModal}
                          onStatusChange={handleTaskStatusChange}
                          onLogTime={(data) => handleLogTaskTime(taskActionsModalTask, data)}
                          updating={statusUpdatingTaskId === taskActionsModalTask.id}
                          animationKey={actionsModalAnimationKey}
                        />
                      )}

                      {statusMenu && statusMenuTask && (
                        <TaskStatusMenu
                          task={statusMenuTask}
                          screen={statusMenu.screen}
                          onClose={() => setStatusMenu(null)}
                          onStatusChange={handleTaskStatusChange}
                          onLogTime={(data) => handleLogTaskTime(statusMenuTask, data)}
                          updating={statusUpdatingTaskId === statusMenuTask.id}
                        />
                      )}

                      {connectionHint && (
                        <div
                          className={`pointer-events-none fixed z-[85] max-w-[260px] rounded-2xl border px-3 py-2 text-xs font-semibold shadow-2xl backdrop-blur-2xl transition-colors duration-200 ${connectionHint.closing ? 'connection-hint-exit' : 'connection-hint-enter'} ${connectionHint.variant === 'error'
                            ? 'border-red-500/25 bg-red-500/15 text-red-100 shadow-red-950/15 light:bg-red-50/95 light:text-red-700 light:shadow-red-200/30'
                            : connectionHint.variant === 'success'
                              ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-100 shadow-emerald-950/15 light:bg-emerald-50/95 light:text-emerald-700 light:shadow-emerald-200/30'
                              : 'border-brand-500/25 bg-[#020617]/80 text-brand-100 shadow-black/20 light:bg-white/90 light:text-brand-700 light:shadow-slate-300/25'
                            }`}
                          style={{
                            left: Math.min(connectionHint.x + 14, window.innerWidth - 280),
                            top: Math.min(connectionHint.y + 14, window.innerHeight - 90)
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {connectionHint.variant === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <GitBranch className="h-4 w-4 shrink-0" />}
                            <span>{connectionHint.message}</span>
                          </div>
                        </div>
                      )}

                      {edgeToast && (
                        <div className={`fixed right-4 top-28 z-[80] max-w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#020617]/85 p-3 pr-10 text-sm text-slate-100 shadow-2xl shadow-black/20 backdrop-blur-2xl light:border-slate-200/70 light:bg-white/90 light:text-slate-900 light:shadow-slate-300/25 ${edgeToast.closing ? 'toast-exit' : 'animate-slide-down-fade'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${edgeToast.variant === 'success'
                              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 light:text-emerald-700'
                              : 'border-red-500/25 bg-red-500/10 text-red-300 light:text-red-700'
                              }`}>
                              {edgeToast.variant === 'success' ? <GitBranch className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 light:text-slate-500">
                                {edgeToast.variant === 'success' ? 'Workspace updated' : 'Workspace error'}
                              </div>
                              <p className="mt-0.5 leading-relaxed text-slate-200 light:text-slate-700">{edgeToast.message}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => closeEdgeToast(edgeToast.id)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-200 light:hover:bg-slate-950/5 light:hover:text-slate-900"
                            aria-label="Close notification"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {confirmModal && (
                        <ConfirmModal
                          isOpen={true}
                          isClosing={isConfirmClosing}
                          title={confirmModal.title}
                          message={confirmModal.message}
                          isDestructive={confirmModal.isDestructive}
                          onConfirm={confirmModal.onConfirm}
                          onCancel={() => {
                            setIsConfirmClosing(true);
                            setTimeout(() => {
                              setConfirmModal(null);
                              setIsConfirmClosing(false);
                            }, 200);
                          }}
                        />
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
