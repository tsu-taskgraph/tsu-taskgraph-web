import { useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { type ReactFlowInstance } from '@xyflow/react';
import {
  projectsApi,
  type ProjectGraphResponse,
  type ProjectResponse,
  type TaskNode,
  type EdgeResponse
} from '../../../api/projects';
import { mapServerErrorToEnglish } from '../../../api/errors';
import {
  type WorkspaceNode,
  type TaskFlowNode,
  type ViewMode
} from '../utils/workspaceUtils';

type CopiedTaskNode = {
  task: TaskNode;
  position: { x: number; y: number };
};

type CopiedWorkspaceSelection = {
  nodes: CopiedTaskNode[];
  edges: Array<{ sourceTaskId: string; targetTaskId: string }>;
  origin: { x: number; y: number };
};

interface UseWorkspaceCopyPasteProps {
  projectId: string | undefined;
  nodes: WorkspaceNode[];
  setNodes: React.Dispatch<React.SetStateAction<WorkspaceNode[]>>;
  graph: ProjectGraphResponse | null;
  setGraph: React.Dispatch<React.SetStateAction<ProjectGraphResponse | null>>;
  setProject: React.Dispatch<React.SetStateAction<ProjectResponse | null>>;
  viewMode: ViewMode;
  flowInstance: ReactFlowInstance<WorkspaceNode, any> | null;
  takeSnapshot: () => void;
  showEdgeToast: (message: string, variant?: 'error' | 'success') => void;
}

export function useWorkspaceCopyPaste({
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
}: UseWorkspaceCopyPasteProps) {
  const copiedSelectionRef = useRef<CopiedWorkspaceSelection | null>(null);
  const lastPastePositionRef = useRef<{ x: number; y: number } | null>(null);
  const pasteCountRef = useRef(0);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!flowInstance) return;
      lastPastePositionRef.current = flowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [flowInstance]);

  const copySelectedTasks = useCallback(() => {
    const selectedTaskNodes = nodes.filter((node): node is TaskFlowNode =>
      node.type === 'taskNode' && Boolean(node.selected)
    );

    if (selectedTaskNodes.length === 0) {
      showEdgeToast('Select one or more tasks to copy.');
      return;
    }

    const selectedIds = new Set(selectedTaskNodes.map((node) => node.id));
    const selectedEdges = (graph?.edges ?? [])
      .filter((edge) => selectedIds.has(edge.sourceTaskId) && selectedIds.has(edge.targetTaskId))
      .map((edge) => ({ sourceTaskId: edge.sourceTaskId, targetTaskId: edge.targetTaskId }));

    const minX = Math.min(...selectedTaskNodes.map((node) => node.position.x));
    const minY = Math.min(...selectedTaskNodes.map((node) => node.position.y));

    copiedSelectionRef.current = {
      nodes: selectedTaskNodes.map((node) => ({
        task: node.data.task,
        position: node.position
      })),
      edges: selectedEdges,
      origin: { x: minX, y: minY }
    };
    pasteCountRef.current = 0;
    showEdgeToast(`Copied ${selectedTaskNodes.length} task${selectedTaskNodes.length === 1 ? '' : 's'}.`, 'success');
  }, [graph?.edges, nodes, showEdgeToast]);

  const pasteCopiedTasks = useCallback(async () => {
    if (!projectId) return;

    const copiedSelection = copiedSelectionRef.current;
    if (!copiedSelection || copiedSelection.nodes.length === 0) {
      showEdgeToast('Clipboard is empty. Copy tasks first.');
      return;
    }

    takeSnapshot();
    pasteCountRef.current += 1;

    const fallbackPosition = flowInstance?.screenToFlowPosition({
      x: Math.round(window.innerWidth / 2),
      y: Math.round(window.innerHeight / 2)
    }) ?? {
      x: copiedSelection.origin.x + 56 * pasteCountRef.current,
      y: copiedSelection.origin.y + 56 * pasteCountRef.current
    };
    const pasteOrigin = lastPastePositionRef.current ?? fallbackPosition;
    const offset = {
      x: pasteOrigin.x - copiedSelection.origin.x,
      y: pasteOrigin.y - copiedSelection.origin.y
    };

    try {
      let createdTasks = await Promise.all(copiedSelection.nodes.map(({ task, position }) =>
        projectsApi.createTask(projectId, {
          title: `Copy of ${task.title}`,
          description: task.description,
          category: task.category,
          estimatedHours: task.estimatedHours,
          startDate: task.startDate,
          dueDate: task.dueDate,
          positionX: Math.round(position.x + offset.x),
          positionY: Math.round(position.y + offset.y)
        })
      ));

      const taskIdMap = new Map<string, string>();
      copiedSelection.nodes.forEach(({ task }, index) => {
        taskIdMap.set(task.id, createdTasks[index].id);
      });

      const createdEdges: EdgeResponse[] = [];
      for (const edge of copiedSelection.edges) {
        const sourceTaskId = taskIdMap.get(edge.sourceTaskId);
        const targetTaskId = taskIdMap.get(edge.targetTaskId);
        if (!sourceTaskId || !targetTaskId) continue;

        try {
          const createdEdge = await projectsApi.createEdge(projectId, { sourceTaskId, targetTaskId });
          createdEdges.push(createdEdge);
        } catch { }
      }

      const statusPreservedTasks = await Promise.all(createdTasks.map(async (createdTask, index) => {
        const originalTask = copiedSelection.nodes[index].task;

        if (!['IN_PROGRESS', 'COMPLETED', 'SKIPPED'].includes(originalTask.status)) {
          return createdTask;
        }

        try {
          const response = await projectsApi.updateTaskStatus(createdTask.id, {
            status: originalTask.status as 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED',
            loggedHours: originalTask.status === 'COMPLETED' ? originalTask.loggedHours : null,
            comment: 'Status preserved from copied task.'
          });

          return {
            ...response.updatedTask,
            positionX: createdTask.positionX,
            positionY: createdTask.positionY
          };
        } catch {
          return {
            ...createdTask,
            status: originalTask.status,
            completionPercent: originalTask.completionPercent,
            loggedHours: originalTask.loggedHours
          };
        }
      }));
      createdTasks = statusPreservedTasks;

      const createdTaskNodes: TaskFlowNode[] = createdTasks.map((task, index) => ({
        id: task.id,
        type: 'taskNode',
        position: {
          x: task.positionX,
          y: task.positionY
        },
        data: { task, viewMode, index: (graph?.nodes.length ?? nodes.length) + index },
        draggable: true,
        selected: true
      }));

      setNodes((currentNodes) => [
        ...currentNodes.map((node) => ({ ...node, selected: false })),
        ...createdTaskNodes
      ]);
      setGraph((currentGraph) => currentGraph ? {
        ...currentGraph,
        nodes: [...currentGraph.nodes, ...createdTasks],
        edges: [...currentGraph.edges, ...createdEdges]
      } : currentGraph);
      setProject((currentProject) => currentProject ? {
        ...currentProject,
        totalEstimatedHours: (currentProject.totalEstimatedHours ?? 0) + createdTasks.reduce((sum, task) => sum + (task.estimatedHours ?? 0), 0),
        updatedAt: createdTasks[createdTasks.length - 1]?.updatedAt ?? currentProject.updatedAt
      } : currentProject);
      showEdgeToast(`Pasted ${createdTasks.length} task${createdTasks.length === 1 ? '' : 's'}.`, 'success');
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      showEdgeToast(parsed.message);
    }
  }, [flowInstance, graph?.nodes.length, nodes.length, projectId, setNodes, setGraph, setProject, showEdgeToast, viewMode, takeSnapshot]);

  return {
    copySelectedTasks,
    pasteCopiedTasks
  };
}
