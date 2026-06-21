import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { ProjectGraphResponse, TaskNode } from '../api/projects';

export type ViewMode = 'dot' | 'label' | 'full';
export type EdgeTypeMode = 'smoothstep' | 'default' | 'straight' | 'step';
export type ThemeMode = 'light' | 'dark';
export type TaskCreatorMode = 'context' | 'toolbar';

export type TaskDraftPosition = {
  flow: { x: number; y: number };
  screen: { x: number; y: number };
};

export type TaskStatus = TaskNode['status'];

export type TaskFlowNodeData = {
  task: TaskNode;
  viewMode: ViewMode;
  index?: number;
};

export type TaskFlowNode = Node<TaskFlowNodeData, 'taskNode'>;
export type LayerHeaderNode = Node<{ label: string }, 'layerHeader'>;
export type WorkspaceNode = TaskFlowNode | LayerHeaderNode;
export type TaskFlowEdge = Edge;

export function getEdgeVisual(theme: ThemeMode, sourceStatus?: TaskStatus, targetStatus?: TaskStatus) {
  const palette = {
    brand: theme === 'light' ? '#d97706' : '#f59e0b',
    sky: theme === 'light' ? '#0284c7' : '#38bdf8',
    emerald: theme === 'light' ? '#059669' : '#34d399',
    violet: theme === 'light' ? '#7c3aed' : '#a78bfa',
    slate: theme === 'light' ? 'rgba(100, 116, 139, 0.58)' : 'rgba(148, 163, 184, 0.46)',
    neutral: theme === 'light' ? 'rgba(100, 116, 139, 0.48)' : 'rgba(148, 163, 184, 0.38)'
  };

  if (sourceStatus === 'LOCKED' || targetStatus === 'LOCKED') {
    return {
      color: palette.slate,
      strokeWidth: 1.55,
      dashArray: '7 7',
      animated: false,
      opacity: 0.78,
      filter: 'none'
    };
  }

  if (sourceStatus === 'SKIPPED' || targetStatus === 'SKIPPED') {
    return {
      color: palette.violet,
      strokeWidth: 1.8,
      dashArray: '8 6',
      animated: false,
      opacity: 0.82,
      filter: theme === 'light' ? 'drop-shadow(0 2px 6px rgba(124, 58, 237, 0.14))' : 'drop-shadow(0 2px 7px rgba(167, 139, 250, 0.18))'
    };
  }

  if (sourceStatus === 'IN_PROGRESS') {
    return {
      color: palette.sky,
      strokeWidth: 2.6,
      dashArray: undefined,
      animated: true,
      opacity: 0.95,
      filter: theme === 'light' ? 'drop-shadow(0 2px 7px rgba(2, 132, 199, 0.16))' : 'drop-shadow(0 2px 8px rgba(56, 189, 248, 0.22))'
    };
  }

  if (sourceStatus === 'COMPLETED') {
    return {
      color: palette.emerald,
      strokeWidth: 2.15,
      dashArray: undefined,
      animated: false,
      opacity: 0.92,
      filter: theme === 'light' ? 'drop-shadow(0 2px 6px rgba(5, 150, 105, 0.12))' : 'drop-shadow(0 2px 7px rgba(52, 211, 153, 0.18))'
    };
  }

  if (sourceStatus === 'AVAILABLE') {
    return {
      color: palette.brand,
      strokeWidth: 2,
      dashArray: undefined,
      animated: false,
      opacity: 0.9,
      filter: theme === 'light' ? 'drop-shadow(0 2px 6px rgba(217, 119, 6, 0.14))' : 'drop-shadow(0 2px 7px rgba(245, 158, 11, 0.20))'
    };
  }

  return {
    color: palette.neutral,
    strokeWidth: 1.8,
    dashArray: undefined,
    animated: false,
    opacity: 0.72,
    filter: 'none'
  };
}

export function mapGraphToFlow(
  graph: ProjectGraphResponse,
  theme: ThemeMode,
  viewMode: ViewMode,
  edgeType: EdgeTypeMode,
  edgesVisible: boolean,
  showTopologicalLanes: boolean
): { nodes: WorkspaceNode[]; edges: TaskFlowEdge[] } {
  const nodeStatus = new Map(graph.nodes.map((node) => [node.id, node.status]));
  const columnWidth = 400;
  const rowHeight = viewMode === 'full' ? 380 : viewMode === 'label' ? 180 : 80;
  const centerY = 220;

  const nodesByLayer = new Map<number, typeof graph.nodes>();
  graph.nodes.forEach((node) => {
    const layer = node.layer ?? 0;
    if (!nodesByLayer.has(layer)) {
      nodesByLayer.set(layer, []);
    }
    nodesByLayer.get(layer)!.push(node);
  });

  const nodePositionInLayer = new Map<string, { index: number; count: number }>();
  nodesByLayer.forEach((nodesInLayer) => {
    const sortedNodes = [...nodesInLayer].sort((a, b) => (a.positionY ?? 0) - (b.positionY ?? 0));
    sortedNodes.forEach((node, index) => {
      nodePositionInLayer.set(node.id, {
        index,
        count: sortedNodes.length
      });
    });
  });

  const taskNodes: WorkspaceNode[] = graph.nodes.map((task, index) => {
    const layer = task.layer ?? 0;
    const x = layer * columnWidth;

    const posInfo = nodePositionInLayer.get(task.id) ?? { index: 0, count: 1 };

    const y = centerY + (posInfo.index - (posInfo.count - 1) / 2) * rowHeight;

    return {
      id: task.id,
      type: 'taskNode',
      position: { x, y },
      data: { task, viewMode, index },
      draggable: true
    };
  });

  let nodes = [...taskNodes];

  if (showTopologicalLanes) {
    const uniqueLayers = Array.from(new Set(graph.nodes.map(n => n.layer).filter(l => typeof l === 'number'))) as number[];
    uniqueLayers.sort((a, b) => a - b);

    const headerNodes: WorkspaceNode[] = uniqueLayers.map((layer) => ({
      id: `layer-header-${layer}`,
      type: 'layerHeader',
      position: {
        x: layer * columnWidth + (viewMode === 'dot' ? 22 : viewMode === 'label' ? 146 : 159),
        y: -100
      },
      data: { label: String(layer) },
      draggable: false,
      selectable: false,
      deletable: false,
      style: { zIndex: -10, pointerEvents: 'none' } as React.CSSProperties
    }));

    nodes = [...headerNodes, ...taskNodes];
  }

  const edges: TaskFlowEdge[] = graph.edges.map((edge) => {
    const targetStatus = nodeStatus.get(edge.targetTaskId) ?? 'AVAILABLE';
    const sourceStatus = nodeStatus.get(edge.sourceTaskId) ?? 'AVAILABLE';
    const visual = getEdgeVisual(theme, sourceStatus, targetStatus);

    return {
      id: edge.id,
      source: edge.sourceTaskId,
      target: edge.targetTaskId,
      type: edgeType,
      animated: visual.animated,
      reconnectable: true,
      className: `edge-status-${sourceStatus.toLowerCase()}`,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: visual.color
      },
      style: {
        stroke: visual.color,
        strokeWidth: visual.strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeDasharray: visual.dashArray,
        opacity: edgesVisible ? visual.opacity : 0,
        filter: visual.filter,
        transition: 'stroke 0.3s, stroke-width 0.3s, opacity 0.3s, filter 0.3s, d 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: edgesVisible ? 'edge-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' : 'none'
      } as React.CSSProperties
    };
  });

  return { nodes, edges };
}
