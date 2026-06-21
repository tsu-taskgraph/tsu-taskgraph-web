import { useCallback, useState } from 'react';
import axios from 'axios';
import {
  projectsApi,
  type TaskNode,
  type UpdateTaskRequest,
  type ProjectGraphResponse,
} from '../../../api/projects';
import {
  type WorkspaceNode,
  type TaskFlowNode,
  type TaskDraftPosition,
  type ViewMode,
} from '../utils/workspaceUtils';
import { mapServerErrorToEnglish } from '../../../api/errors';

interface UseWorkspaceTaskOperationsProps {
  selectedTask: TaskNode | null;
  selectedTaskId: string | null;
  takeSnapshot: () => void;
  setGraph: React.Dispatch<React.SetStateAction<ProjectGraphResponse | null>>;
  setNodes: React.Dispatch<React.SetStateAction<WorkspaceNode[]>>;
  closeTaskDetailsSidebar: () => void;
  showEdgeToast: (message: string, variant?: 'error' | 'success') => void;
  setStatusMenu: React.Dispatch<React.SetStateAction<{ taskId: string; screen: { x: number; y: number } } | null>>;
  taskDraftPosition: TaskDraftPosition | null;
  setTaskDraftPosition: React.Dispatch<React.SetStateAction<TaskDraftPosition | null>>;
  viewMode: ViewMode;
  graph: ProjectGraphResponse | null;
  nodes: WorkspaceNode[];
  setProject: React.Dispatch<React.SetStateAction<any>>;
  setIsAligned: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmModal: React.Dispatch<React.SetStateAction<{
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>>;
  setIsConfirmClosing: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useWorkspaceTaskOperations({
  selectedTask,
  selectedTaskId,
  takeSnapshot,
  setGraph,
  setNodes,
  closeTaskDetailsSidebar,
  showEdgeToast,
  setStatusMenu,
  taskDraftPosition,
  setTaskDraftPosition,
  viewMode,
  graph,
  nodes,
  setProject,
  setIsAligned,
  setConfirmModal,
  setIsConfirmClosing,
}: UseWorkspaceTaskOperationsProps) {
  const [statusUpdatingTaskId, setStatusUpdatingTaskId] = useState<string | null>(null);

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
    setProject((currentProject: any) => currentProject ? {
      ...currentProject,
      totalEstimatedHours: (currentProject.totalEstimatedHours ?? 0) + (createdTask.estimatedHours ?? 0),
      updatedAt: createdTask.updatedAt
    } : currentProject);
    setIsAligned(false);
    setTaskDraftPosition(null);
  }, [graph?.nodes.length, nodes.length, taskDraftPosition, viewMode, setNodes, takeSnapshot, setGraph, setProject, setIsAligned, setTaskDraftPosition]);

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
  }, [setGraph, setNodes, showEdgeToast, takeSnapshot, setStatusMenu]);

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
  }, [selectedTask, selectedTaskId, takeSnapshot, setGraph, setNodes, closeTaskDetailsSidebar, showEdgeToast, setConfirmModal, setIsConfirmClosing]);

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
  }, [selectedTask, setNodes, showEdgeToast, takeSnapshot, setGraph, setStatusMenu]);

  return {
    statusUpdatingTaskId,
    handleTaskCreated,
    handleTaskUpdate,
    handleLogTaskTime,
    handleDeleteTask,
    handleTaskStatusChange
  };
}
