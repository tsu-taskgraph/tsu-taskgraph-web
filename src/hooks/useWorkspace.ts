import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import {
  projectsApi,
  type ProjectGraphResponse,
  type TaskNode,
  type UpdateTaskRequest
} from '../api/projects';
import { useTheme } from '../context/ThemeContext';
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
import { mapServerErrorToEnglish } from '../api/errors';
import { useUndoRedo } from './useUndoRedo';
import { useWorkspaceCopyPaste } from './useWorkspaceCopyPaste';
import { useWorkspaceConnections } from './useWorkspaceConnections';
import { useWorkspaceLoader } from './useWorkspaceLoader';
import { useWorkspaceLayout } from './useWorkspaceLayout';

const isEditableShortcutTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
};

export function useWorkspace(projectId: string | undefined) {
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

  const handleTaskCreated = useCallback((createdTask: TaskNode) => {
    takeSnapshot();
    if (!taskDraftPosition) return;
    const createdNode: WorkspaceNode = {
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
  }, [graph?.nodes.length, nodes.length, taskDraftPosition, viewMode, setNodes, takeSnapshot, setGraph, setProject, setIsAligned]);

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

  const handleUndo = useCallback(() => {
    undo(setNodes, setEdges, setGraph);
  }, [undo, setNodes, setEdges, setGraph]);

  const handleRedo = useCallback(() => {
    redo(setNodes, setEdges, setGraph);
  }, [redo, setNodes, setEdges, setGraph]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableShortcutTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const isModifierPressed = event.metaKey || event.ctrlKey;

      if ((key === 'delete' || key === 'backspace') && selectedTaskId && !isModifierPressed) {
        event.preventDefault();
        handleDeleteTask(selectedTaskId);
        return;
      }

      if (!isModifierPressed) return;

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
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if (key === 'y') {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copySelectedTasks, pasteCopiedTasks, handleUndo, handleRedo, selectedTaskId, handleDeleteTask]);

  return {
    theme,
    toggleTheme,
    isScrolled,
    viewMode,
    setViewMode,
    edgeType,
    setEdgeType,
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    edgesVisible,
    setEdgesVisible,
    showTopologicalLanes,
    setShowTopologicalLanes,
    flowInstance,
    setFlowInstance,
    taskDraftPosition,
    setTaskDraftPosition,
    taskCreatorMode,
    setTaskCreatorMode,
    taskCreatorAnimationKey,
    setTaskCreatorAnimationKey,
    isClosing,
    setIsClosing,
    edgeToast,
    setEdgeToast,
    selectedTaskId,
    setSelectedTaskId,
    isTaskSidebarOpen,
    setIsTaskSidebarOpen,
    isTaskSidebarClosing,
    setIsTaskSidebarClosing,
    statusUpdatingTaskId,
    setStatusUpdatingTaskId,
    statusMenu,
    setStatusMenu,
    taskActionsModalTaskId,
    setTaskActionsModalTaskId,
    isActionsModalClosing,
    setIsActionsModalClosing,
    actionsModalAnimationKey,
    setActionsModalAnimationKey,
    confirmModal,
    setConfirmModal,
    isConfirmClosing,
    setIsConfirmClosing,
    selectedTask,
    statusMenuTask,
    taskActionsModalTask,
    uniqueLayers,
    graphStats,
    project,
    graph,
    loading,
    refreshing,
    error,
    loadWorkspace,
    isAligned,
    setIsAligned,
    handleNodeDragStart,
    handleNodeDrag,
    autoArrangeLayout,
    connectionHint,
    handleConnect,
    handleConnectStart,
    handleConnectEnd,
    isValidConnection,
    handleReconnectStart,
    handleReconnect,
    handleReconnectEnd,
    copySelectedTasks,
    pasteCopiedTasks,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    closeEdgeToast,
    showEdgeToast,
    openTaskCreator,
    closeTaskCreator,
    openTaskActionsModal,
    closeTaskActionsModal,
    handlePaneContextMenu,
    cancelTaskDetailsSidebarClose,
    closeSidebarOnly,
    closeTaskDetailsSidebar,
    handleNodeClick,
    handleNodeContextMenu,
    handlePaneClick,
    handleSelectionChange,
    handleTaskCreated,
    handleTaskUpdate,
    handleLogTaskTime,
    handleDeleteTask,
    handleTaskStatusChange
  };
}
