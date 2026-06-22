import { useEffect, useRef } from 'react';
import { projectsApi, type ProjectGraphResponse, type ProjectResponse } from '../../../api/projects';

const POLL_INTERVAL_MS = 5000;

interface UseWorkspacePollingProps {
    projectId: string | undefined;
    graph: ProjectGraphResponse | null;
    setGraph: React.Dispatch<React.SetStateAction<ProjectGraphResponse | null>>;
    setProject: React.Dispatch<React.SetStateAction<ProjectResponse | null>>;
}

function graphsEqual(a: ProjectGraphResponse, b: ProjectGraphResponse): boolean {
    if (a.enrichmentStatus !== b.enrichmentStatus) return false;
    if (a.nodes.length !== b.nodes.length) return false;
    if (a.edges.length !== b.edges.length) return false;

    const bNodeMap = new Map(b.nodes.map((n) => [n.id, n]));
    for (const node of a.nodes) {
        const other = bNodeMap.get(node.id);
        if (!other) return false;
        if (node.status !== other.status) return false;
        if (node.updatedAt !== other.updatedAt) return false;
        if (node.enrichment !== other.enrichment) {
            if (JSON.stringify(node.enrichment) !== JSON.stringify(other.enrichment)) return false;
        }
    }

    return true;
}

export function useWorkspacePolling({ projectId, graph, setGraph, setProject }: UseWorkspacePollingProps) {
    const setGraphRef = useRef(setGraph);
    setGraphRef.current = setGraph;

    const setProjectRef = useRef(setProject);
    setProjectRef.current = setProject;

    const currentGraphRef = useRef(graph);
    currentGraphRef.current = graph;

    const enrichmentStatus = graph?.enrichmentStatus;
    const shouldPoll = enrichmentStatus === 'PENDING' || enrichmentStatus === 'IN_PROGRESS';

    useEffect(() => {
        if (!projectId || !shouldPoll) return;

        let cancelled = false;

        const poll = async () => {
            if (cancelled) return;
            try {
                const fresh = await projectsApi.getProjectGraph(projectId);

                if (cancelled) return;

                const prevGraph = currentGraphRef.current;

                setGraphRef.current((prev) => {
                    if (!prev) return fresh;
                    if (graphsEqual(prev, fresh)) return prev;
                    return fresh;
                });

                if (fresh.enrichmentStatus === 'COMPLETED' && prevGraph && prevGraph.enrichmentStatus !== 'COMPLETED') {
                    try {
                        const freshProject = await projectsApi.getProject(projectId);
                        if (!cancelled) {
                            setProjectRef.current(freshProject);
                        }
                    } catch {}
                }
            } catch {}
        };

        const timer = window.setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [projectId, shouldPoll]);
}
