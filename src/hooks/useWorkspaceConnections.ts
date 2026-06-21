import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { type Connection, type Edge } from '@xyflow/react';
import { projectsApi, type ProjectGraphResponse } from '../api/projects';
import { mapServerErrorToEnglish } from '../api/errors';

export type ConnectionHintState = {
  x: number;
  y: number;
  message: string;
  variant: 'info' | 'success' | 'error';
  closing: boolean;
};

interface UseWorkspaceConnectionsProps {
  projectId: string | undefined;
  graph: ProjectGraphResponse | null;
  setGraph: React.Dispatch<React.SetStateAction<ProjectGraphResponse | null>>;
  takeSnapshot: () => void;
  showEdgeToast: (message: string, variant?: 'error' | 'success') => void;
  loadWorkspace: (showRefresh?: boolean) => Promise<void>;
}

export function useWorkspaceConnections({
  projectId,
  graph,
  setGraph,
  takeSnapshot,
  showEdgeToast,
  loadWorkspace
}: UseWorkspaceConnectionsProps) {
  const [connectionHint, setConnectionHint] = useState<ConnectionHintState | null>(null);
  const connectionSourceRef = useRef<string | null>(null);
  const reconnectSuccessRef = useRef<boolean>(false);

  const wouldCreateCycle = useCallback((sourceTaskId: string, targetTaskId: string) => {
    if (sourceTaskId === targetTaskId) return true;
    if (!graph) return false;

    const adjacency = new Map<string, string[]>();
    graph.nodes.forEach((node) => adjacency.set(node.id, []));
    graph.edges.forEach((edge) => {
      adjacency.get(edge.sourceTaskId)?.push(edge.targetTaskId);
    });

    const stack = [targetTaskId];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || visited.has(current)) continue;
      if (current === sourceTaskId) return true;

      visited.add(current);
      stack.push(...(adjacency.get(current) ?? []));
    }

    return false;
  }, [graph]);

  const getConnectionBlockReason = useCallback((sourceTaskId: string, targetTaskId: string) => {
    if (sourceTaskId === targetTaskId) {
      return 'Cannot connect a task to itself.';
    }

    const duplicateEdge = graph?.edges.some((edge) =>
      edge.sourceTaskId === sourceTaskId && edge.targetTaskId === targetTaskId
    );

    if (duplicateEdge) {
      return 'This dependency already exists.';
    }

    const targetTask = graph?.nodes.find((node) => node.id === targetTaskId);
    if (targetTask?.status === 'COMPLETED') {
      return 'Cannot create dependency to a completed task.';
    }

    if (wouldCreateCycle(sourceTaskId, targetTaskId)) {
      return 'Cannot create dependency: cycle detected.';
    }

    return null;
  }, [graph?.edges, graph?.nodes, wouldCreateCycle]);

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    if (!connection.source || !connection.target) return false;

    const blockReason = getConnectionBlockReason(connection.source, connection.target);
    setConnectionHint((current) => {
      if (!current) return current;
      const nextMessage = blockReason ?? 'Release to create dependency.';
      const nextVariant = blockReason ? 'error' : 'success';
      if (current.message === nextMessage && current.variant === nextVariant) return current;
      return {
        ...current,
        message: nextMessage,
        variant: nextVariant,
        closing: false
      };
    });

    return !blockReason;
  }, [getConnectionBlockReason]);

  const getConnectionClientPoint = useCallback((event: MouseEvent | TouchEvent) => {
    if ('touches' in event && event.touches.length > 0) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }

    if ('changedTouches' in event && event.changedTouches.length > 0) {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }

    return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
  }, []);

  const handleConnectStart = useCallback((event: MouseEvent | TouchEvent, params: { nodeId?: string | null }) => {
    connectionSourceRef.current = params.nodeId ?? null;
    const point = getConnectionClientPoint(event);
    setConnectionHint({
      x: point.x,
      y: point.y,
      message: 'Drag to a target task.',
      variant: 'info',
      closing: false
    });
  }, [getConnectionClientPoint]);

  const handleConnectEnd = useCallback(() => {
    const linger = connectionHint?.variant === 'error';
    connectionSourceRef.current = null;

    window.setTimeout(() => {
      setConnectionHint((current) => current ? { ...current, closing: true } : current);
      window.setTimeout(() => setConnectionHint(null), 100);
    }, linger ? 450 : 0);
  }, [connectionHint?.variant]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!connectionSourceRef.current) return;
      setConnectionHint((current) => current ? {
        ...current,
        x: event.clientX,
        y: event.clientY
      } : current);
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  const isCycleApiError = useCallback((err: unknown, statusCode?: number) => {
    if (statusCode !== 400) return false;
    const data = axios.isAxiosError(err) ? err.response?.data : err;
    const serialized = typeof data === 'string' ? data : JSON.stringify(data ?? '');
    const lower = serialized.toLowerCase();
    return lower.includes('cycle') || lower.includes('цик');
  }, []);

  const handleConnect = useCallback(async (connection: Connection) => {
    if (!projectId || !connection.source || !connection.target) return;
    takeSnapshot();

    const blockReason = getConnectionBlockReason(connection.source, connection.target);

    if (blockReason) {
      showEdgeToast(blockReason);
      return;
    }

    try {
      const createdEdge = await projectsApi.createEdge(projectId, {
        sourceTaskId: connection.source,
        targetTaskId: connection.target
      });

      setGraph((currentGraph) => currentGraph ? {
        ...currentGraph,
        edges: [...currentGraph.edges, createdEdge]
      } : currentGraph);
      showEdgeToast('Dependency created.', 'success');
      void loadWorkspace(true);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      showEdgeToast(isCycleApiError(err, statusCode) ? 'Cannot create dependency: cycle detected.' : parsed.message);
    }
  }, [getConnectionBlockReason, isCycleApiError, projectId, showEdgeToast, takeSnapshot, setGraph, loadWorkspace]);

  const handleReconnectStart = useCallback((event: any, edge: Edge) => {
    reconnectSuccessRef.current = false;
    connectionSourceRef.current = edge.source;
    const point = getConnectionClientPoint(event);
    setConnectionHint({
      x: point.x,
      y: point.y,
      message: 'Drag to a new target task.',
      variant: 'info',
      closing: false
    });
  }, [getConnectionClientPoint]);

  const handleReconnect = useCallback(async (oldEdge: Edge, newConnection: Connection) => {
    if (!projectId || !newConnection.source || !newConnection.target) return;
    
    if (oldEdge.source === newConnection.source && oldEdge.target === newConnection.target) {
      reconnectSuccessRef.current = true;
      return;
    }

    const blockReason = getConnectionBlockReason(newConnection.source, newConnection.target);
    if (blockReason) {
      showEdgeToast(blockReason);
      return;
    }

    reconnectSuccessRef.current = true;
    takeSnapshot();

    try {
      await projectsApi.deleteEdge(oldEdge.id);
      
      const createdEdge = await projectsApi.createEdge(projectId, {
        sourceTaskId: newConnection.source,
        targetTaskId: newConnection.target
      });

      setGraph((currentGraph) => {
        if (!currentGraph) return null;
        const filtered = currentGraph.edges.filter((e) => e.id !== oldEdge.id);
        return {
          ...currentGraph,
          edges: [...filtered, createdEdge]
        };
      });

      showEdgeToast('Dependency updated.', 'success');
      void loadWorkspace(true);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      showEdgeToast(isCycleApiError(err, statusCode) ? 'Cannot update dependency: cycle detected.' : parsed.message);
    }
  }, [getConnectionBlockReason, isCycleApiError, projectId, showEdgeToast, takeSnapshot, setGraph, loadWorkspace]);

  const handleReconnectEnd = useCallback(async (_event: any, edge: Edge) => {
    const linger = connectionHint?.variant === 'error';
    connectionSourceRef.current = null;

    window.setTimeout(() => {
      setConnectionHint((current) => current ? { ...current, closing: true } : current);
      window.setTimeout(() => setConnectionHint(null), 100);
    }, linger ? 450 : 0);

    if (!reconnectSuccessRef.current && projectId) {
      takeSnapshot();
      try {
        await projectsApi.deleteEdge(edge.id);
        setGraph((currentGraph) => {
          if (!currentGraph) return null;
          return {
            ...currentGraph,
            edges: currentGraph.edges.filter((e) => e.id !== edge.id)
          };
        });
        showEdgeToast('Dependency deleted.', 'success');
        void loadWorkspace(true);
      } catch (err) {
        const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
        const parsed = mapServerErrorToEnglish(err, statusCode);
        showEdgeToast(parsed.message);
      }
    }
  }, [connectionHint?.variant, projectId, takeSnapshot, setGraph, showEdgeToast, loadWorkspace]);

  return {
    connectionHint,
    handleConnect,
    handleConnectStart,
    handleConnectEnd,
    isValidConnection,
    handleReconnectStart,
    handleReconnect,
    handleReconnectEnd
  };
}
