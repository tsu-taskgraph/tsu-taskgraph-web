import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { projectsApi, type ProjectResponse, type ProjectGraphResponse } from '../../../api/projects';
import { mapServerErrorToEnglish } from '../../../api/errors';

interface UseWorkspaceLoaderProps {
  projectId: string | undefined;
  onRefresh?: () => void;
}

export function useWorkspaceLoader({ projectId, onRefresh }: UseWorkspaceLoaderProps) {
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [graph, setGraph] = useState<ProjectGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async (showRefresh = false) => {
    if (!projectId) {
      setError('Project id is missing.');
      setLoading(false);
      return;
    }

    if (showRefresh) {
      setRefreshing(true);
      if (onRefresh) onRefresh();
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
  }, [projectId, onRefresh]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadWorkspace();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  return {
    project,
    setProject,
    graph,
    setGraph,
    loading,
    refreshing,
    error,
    loadWorkspace
  };
}
