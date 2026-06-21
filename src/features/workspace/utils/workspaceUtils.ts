import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { ProjectGraphResponse, TaskNode } from '../../../api/projects';

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

export function buildEdgeMarker(color: string, width = 30, height = 30) {
  return {
    type: MarkerType.ArrowClosed,
    width,
    height,
    color,
    markerUnits: 'userSpaceOnUse' as const,
  };
}

export const EDGE_HOVER_COLOR = '#f43f5e';

const EDGE_GRADIENT_STOPS: Record<ThemeMode, Record<TaskStatus, [string, string]>> = {
  dark: {
    AVAILABLE: ['#f97316', '#fbbf24'],
    IN_PROGRESS: ['#3b82f6', '#38bdf8'],
    COMPLETED: ['#14b8a6', '#34d399'],
    SKIPPED: ['#d946ef', '#a78bfa'],
    LOCKED: ['#64748b', '#94a3b8']
  },
  light: {
    AVAILABLE: ['#c2410c', '#d97706'],
    IN_PROGRESS: ['#1d4ed8', '#0284c7'],
    COMPLETED: ['#059669', '#0d9488'],
    SKIPPED: ['#c026d3', '#7c3aed'],
    LOCKED: ['#475569', '#64748b']
  }
};

export type EdgeVisual = {
  from: string;
  to: string;
  strokeWidth: number;
  dashArray: string;
  opacity: number;
  flowDuration: string;
};

function edgeGradientColors(theme: ThemeMode, status: TaskStatus): [string, string] {
  return EDGE_GRADIENT_STOPS[theme][status] ?? EDGE_GRADIENT_STOPS[theme].AVAILABLE;
}

export function getEdgeVisual(theme: ThemeMode, sourceStatus?: TaskStatus): EdgeVisual {
  const status = sourceStatus ?? 'AVAILABLE';
  const [from, to] = edgeGradientColors(theme, status);
  const flowDuration = status === 'IN_PROGRESS' ? '0.5s' : '2.4s';

  return { from, to, strokeWidth: 1.8, dashArray: '6 6', opacity: 0.9, flowDuration };
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
    const sourceStatus = nodeStatus.get(edge.sourceTaskId) ?? 'AVAILABLE';
    const visual = getEdgeVisual(theme, sourceStatus);
    const animation = edgesVisible
      ? `edge-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both, flow-dash ${visual.flowDuration} linear infinite`
      : 'none';

    return {
      id: edge.id,
      source: edge.sourceTaskId,
      target: edge.targetTaskId,
      type: 'gradient',
      data: { shape: edgeType, from: visual.from, to: visual.to },
      animated: false,
      reconnectable: true,
      className: `edge-status-${sourceStatus.toLowerCase()}`,
      markerEnd: buildEdgeMarker(visual.to),
      style: {
        stroke: visual.to,
        strokeWidth: visual.strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeDasharray: visual.dashArray,
        opacity: edgesVisible ? visual.opacity : 0,
        transition: 'stroke 0.3s ease, stroke-width 0.3s ease, opacity 0.3s ease, d 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        animation
      } as React.CSSProperties
    };
  });

  return { nodes, edges };
}
