import { useCallback, useState } from 'react';
import { type ProjectGraphResponse } from '../../../api/projects';
import {
  mapGraphToFlow,
  type ViewMode,
  type EdgeTypeMode,
  type WorkspaceNode,
  type TaskFlowNode,
} from '../utils/workspaceUtils';

interface UseWorkspaceLayoutProps {
  graph: ProjectGraphResponse | null;
  nodes: WorkspaceNode[];
  setNodes: React.Dispatch<React.SetStateAction<WorkspaceNode[]>>;
  theme: 'light' | 'dark';
  viewMode: ViewMode;
  edgeType: EdgeTypeMode;
  edgesVisible: boolean;
  showTopologicalLanes: boolean;
  takeSnapshot: () => void;
}

export function useWorkspaceLayout({
  graph,
  nodes,
  setNodes,
  theme,
  viewMode,
  edgeType,
  edgesVisible,
  showTopologicalLanes,
  takeSnapshot,
}: UseWorkspaceLayoutProps) {
  const [isAligned, setIsAligned] = useState(true);

  const handleNodeDragStart = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

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
    takeSnapshot();

    const flow = mapGraphToFlow(graph, theme, viewMode, edgeType, edgesVisible, showTopologicalLanes);
    const selectedTaskNodes = nodes.filter((node): node is TaskFlowNode =>
      node.type === 'taskNode' && Boolean(node.selected)
    );
    const selectedTaskIds = new Set(selectedTaskNodes.map((node) => node.id));

    if (selectedTaskIds.size === 0) {
      setNodes(flow.nodes);
      setIsAligned(true);
      return;
    }

    const allTaskNodesSelected = selectedTaskIds.size === graph.nodes.length;

    if (allTaskNodesSelected) {
      setNodes(flow.nodes.map((node) => (
        node.type === 'taskNode' ? { ...node, selected: true } : node
      )));
      setIsAligned(true);
      return;
    }

    const selectedGraph: ProjectGraphResponse = {
      ...graph,
      nodes: graph.nodes.filter((node) => selectedTaskIds.has(node.id)),
      edges: graph.edges.filter((edge) =>
        selectedTaskIds.has(edge.sourceTaskId) && selectedTaskIds.has(edge.targetTaskId)
      )
    };
    const selectedFlow = mapGraphToFlow(selectedGraph, theme, viewMode, edgeType, edgesVisible, false);
    const alignedSelectedTaskNodes = selectedFlow.nodes.filter((node): node is TaskFlowNode => node.type === 'taskNode');
    const alignedSelectedNodeById = new Map(alignedSelectedTaskNodes.map((node) => [node.id, node]));

    const currentMinX = Math.min(...selectedTaskNodes.map((node) => node.position.x));
    const currentMinY = Math.min(...selectedTaskNodes.map((node) => node.position.y));
    const alignedMinX = Math.min(...alignedSelectedTaskNodes.map((node) => node.position.x));
    const alignedMinY = Math.min(...alignedSelectedTaskNodes.map((node) => node.position.y));
    const offset = {
      x: currentMinX - alignedMinX,
      y: currentMinY - alignedMinY
    };

    setNodes((currentNodes): WorkspaceNode[] => currentNodes.map((node) => {
      if (node.type !== 'taskNode' || !selectedTaskIds.has(node.id)) {
        return node;
      }

      const alignedNode = alignedSelectedNodeById.get(node.id);
      if (!alignedNode) return node;

      const updatedNode: TaskFlowNode = {
        ...node,
        position: {
          x: alignedNode.position.x + offset.x,
          y: alignedNode.position.y + offset.y
        },
        data: alignedNode.data,
        selected: true
      };

      return updatedNode;
    }));
    setIsAligned(false);
  }, [edgeType, edgesVisible, graph, nodes, setNodes, showTopologicalLanes, theme, viewMode, takeSnapshot]);

  return {
    isAligned,
    setIsAligned,
    handleNodeDragStart,
    handleNodeDrag,
    autoArrangeLayout
  };
}
