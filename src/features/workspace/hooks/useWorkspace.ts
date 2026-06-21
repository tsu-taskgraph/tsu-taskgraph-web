import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
  MarkerType,
} from '@xyflow/react';
import {
  type ProjectGraphResponse,
  type TaskNode,
  projectsApi,
} from '../../../api/projects';
import { mapServerErrorToEnglish } from '../../../api/errors';
import { useTheme } from '../../../context/ThemeContext';
import {
  mapGraphToFlow,
  type ViewMode,
  type EdgeTypeMode,
  type WorkspaceNode,
  type TaskFlowEdge,
} from '../utils/workspaceUtils';
import { useUndoRedo } from '../../../hooks/useUndoRedo';
import { useWorkspaceCopyPaste } from './useWorkspaceCopyPaste';
import { useWorkspaceConnections } from './useWorkspaceConnections';
import { useWorkspaceLoader } from './useWorkspaceLoader';
import { useWorkspaceLayout } from './useWorkspaceLayout';
import { useWorkspaceToast } from './useWorkspaceToast';
import { useWorkspaceModals } from './useWorkspaceModals';
import { useWorkspaceTaskOperations } from './useWorkspaceTaskOperations';

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

  const toast = useWorkspaceToast();

  const modals = useWorkspaceModals({ flowInstance });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [isTaskSidebarClosing, setIsTaskSidebarClosing] = useState(false);
  const taskSidebarCloseTimerRef = useRef<number | null>(null);
  const suppressTaskSidebarSelectionRef = useRef(false);
  const lastTaskNodeClickAtRef = useRef(0);

  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const {
    takeSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    updateCurrentState
  } = useUndoRedo<WorkspaceNode, TaskFlowEdge, ProjectGraphResponse>();

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
    showEdgeToast: toast.showEdgeToast,
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
    showEdgeToast: toast.showEdgeToast
  });

  const operations = useWorkspaceTaskOperations({
    selectedTask: useMemo(() => {
      if (!selectedTaskId) return null;
      return graph?.nodes.find((task) => task.id === selectedTaskId) ?? null;
    }, [graph?.nodes, selectedTaskId]),
    selectedTaskId,
    takeSnapshot,
    setGraph,
    setNodes,
    closeTaskDetailsSidebar: useCallback(() => {
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
    }, [selectedTaskId, setNodes]),
    showEdgeToast: toast.showEdgeToast,
    setStatusMenu: modals.setStatusMenu,
    taskDraftPosition: modals.taskDraftPosition,
    setTaskDraftPosition: modals.setTaskDraftPosition,
    viewMode,
    graph,
    nodes,
    setProject,
    setIsAligned,
    setConfirmModal: modals.setConfirmModal,
    setIsConfirmClosing: modals.setIsConfirmClosing,
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

  const handlePaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
    event.preventDefault();
    modals.openTaskCreator(event.clientX, event.clientY);
  }, [modals]);

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

    modals.setTaskDraftPosition(null);
    modals.setStatusMenu({
      taskId: node.id,
      screen: {
        x: event.clientX,
        y: event.clientY
      }
    });

    setTimeout(() => {
      suppressTaskSidebarSelectionRef.current = false;
    }, 50);
  }, [closeSidebarOnly, isTaskSidebarOpen, setNodes, modals]);

  const handlePaneClick = useCallback(() => {
    modals.closeTaskCreator();
    closeTaskDetailsSidebar();
    modals.setStatusMenu(null);
    modals.closeTaskActionsModal();
  }, [modals, closeTaskDetailsSidebar]);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: TaskFlowEdge) => {
    event.stopPropagation();
    const sourceTask = graph?.nodes.find(n => n.id === edge.source);
    const targetTask = graph?.nodes.find(n => n.id === edge.target);

    if (sourceTask && targetTask) {
      modals.setConfirmModal({
        title: 'Delete dependency?',
        message: `Remove connection from "${sourceTask.title}" to "${targetTask.title}"?`,
        isDestructive: true,
        onConfirm: async () => {
          modals.setIsConfirmClosing(true);
          setTimeout(() => {
            modals.setConfirmModal(null);
            modals.setIsConfirmClosing(false);
          }, 200);

          takeSnapshot();
          try {
            await projectsApi.deleteEdge(edge.id);
            setEdges((currentEdges) => currentEdges.filter(e => e.id !== edge.id));
            setGraph((currentGraph) => currentGraph ? {
              ...currentGraph,
              edges: currentGraph.edges.filter(e => e.id !== edge.id)
            } : currentGraph);
            toast.showEdgeToast('Dependency deleted.', 'success');
          } catch (err) {
            const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
            const parsed = mapServerErrorToEnglish(err, statusCode);
            toast.showEdgeToast(parsed.message);
          }
        }
      });
    }
  }, [graph, takeSnapshot, setEdges, setGraph, modals, toast]);

  const handleEdgeMouseEnter = useCallback((_event: React.MouseEvent, edge: TaskFlowEdge) => {
    setHoveredEdgeId(edge.id);
  }, []);

  const handleEdgeMouseLeave = useCallback(() => {
    setHoveredEdgeId(null);
  }, []);

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
    if (!modals.statusMenu?.taskId) return null;
    return graph?.nodes.find((task) => task.id === modals.statusMenu!.taskId) ?? null;
  }, [graph?.nodes, modals.statusMenu]);

  const taskActionsModalTask = useMemo(() => {
    if (!modals.taskActionsModalTaskId) return null;
    return graph?.nodes.find((task) => task.id === modals.taskActionsModalTaskId) ?? null;
  }, [graph?.nodes, modals.taskActionsModalTaskId]);

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

  const displayEdges = useMemo(() => {
    return edges.map(edge => {
      if (edge.id === hoveredEdgeId) {
        const currentMarker = edge.markerEnd as any;
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: '#f59e0b',
          },
          markerEnd: currentMarker
            ? {
              type: currentMarker.type,
              width: currentMarker.width,
              height: currentMarker.height,
              color: '#f59e0b',
            }
            : undefined,
          animated: true,
        };
      }
      return edge;
    });
  }, [edges, hoveredEdgeId]);

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
        operations.handleDeleteTask(selectedTaskId);
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
  }, [copySelectedTasks, pasteCopiedTasks, handleUndo, handleRedo, selectedTaskId, operations.handleDeleteTask]);

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

    edgeToast: toast.edgeToast,
    setEdgeToast: toast.setEdgeToast,
    closeEdgeToast: toast.closeEdgeToast,
    showEdgeToast: toast.showEdgeToast,

    taskDraftPosition: modals.taskDraftPosition,
    setTaskDraftPosition: modals.setTaskDraftPosition,
    taskCreatorMode: modals.taskCreatorMode,
    setTaskCreatorMode: modals.setTaskCreatorMode,
    taskCreatorAnimationKey: modals.taskCreatorAnimationKey,
    setTaskCreatorAnimationKey: modals.setTaskCreatorAnimationKey,
    isClosing: modals.isClosing,
    setIsClosing: modals.setIsClosing,
    taskActionsModalTaskId: modals.taskActionsModalTaskId,
    setTaskActionsModalTaskId: modals.setTaskActionsModalTaskId,
    isActionsModalClosing: modals.isActionsModalClosing,
    setIsActionsModalClosing: modals.setIsActionsModalClosing,
    actionsModalAnimationKey: modals.actionsModalAnimationKey,
    setActionsModalAnimationKey: modals.setActionsModalAnimationKey,
    confirmModal: modals.confirmModal,
    setConfirmModal: modals.setConfirmModal,
    isConfirmClosing: modals.isConfirmClosing,
    setIsConfirmClosing: modals.setIsConfirmClosing,
    statusMenu: modals.statusMenu,
    setStatusMenu: modals.setStatusMenu,
    openTaskCreator: modals.openTaskCreator,
    closeTaskCreator: modals.closeTaskCreator,
    openTaskActionsModal: modals.openTaskActionsModal,
    closeTaskActionsModal: modals.closeTaskActionsModal,

    selectedTaskId,
    setSelectedTaskId,
    isTaskSidebarOpen,
    setIsTaskSidebarOpen,
    isTaskSidebarClosing,
    setIsTaskSidebarClosing,
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

    handlePaneContextMenu,
    cancelTaskDetailsSidebarClose,
    closeSidebarOnly,
    closeTaskDetailsSidebar,
    handleNodeClick,
    handleNodeContextMenu,
    handlePaneClick,
    handleSelectionChange,
    handleEdgeClick,
    handleEdgeMouseEnter,
    handleEdgeMouseLeave,
    displayEdges,

    statusUpdatingTaskId: operations.statusUpdatingTaskId,
    handleTaskCreated: operations.handleTaskCreated,
    handleTaskUpdate: operations.handleTaskUpdate,
    handleLogTaskTime: operations.handleLogTaskTime,
    handleDeleteTask: operations.handleDeleteTask,
    handleTaskStatusChange: operations.handleTaskStatusChange
  };
}