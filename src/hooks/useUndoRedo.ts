import { useCallback, useRef, useState } from 'react';
import { type Node, type Edge } from '@xyflow/react';

export type HistoryItem<TNode = any, TEdge = any, TGraph = any> = {
  nodes: TNode[];
  edges: TEdge[];
  graph: TGraph | null;
};

const cloneState = <TNode extends Node, TEdge extends Edge, TGraph>(
  nodes: TNode[],
  edges: TEdge[],
  graph: TGraph | null
): HistoryItem<TNode, TEdge, TGraph> => {
  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: { ...node.data },
      selected: node.selected
    })),
    edges: edges.map((edge) => ({
      ...edge
    })),
    graph: graph
      ? ({
          ...graph,
          nodes: (graph as any).nodes.map((n: any) => ({ ...n, assignees: n.assignees ? [...n.assignees] : [] })),
          edges: [...(graph as any).edges]
        } as unknown as TGraph)
      : null
  };
};

export function useUndoRedo<TNode extends Node = Node, TEdge extends Edge = Edge, TGraph = any>() {
  const [past, setPast] = useState<HistoryItem<TNode, TEdge, TGraph>[]>([]);
  const [future, setFuture] = useState<HistoryItem<TNode, TEdge, TGraph>[]>([]);

  const currentStateRef = useRef<HistoryItem<TNode, TEdge, TGraph>>({
    nodes: [],
    edges: [],
    graph: null
  });

  const updateCurrentState = useCallback((nodes: TNode[], edges: TEdge[], graph: TGraph | null) => {
    currentStateRef.current = { nodes, edges, graph };
  }, []);

  const takeSnapshot = useCallback(() => {
    const clone = cloneState(
      currentStateRef.current.nodes,
      currentStateRef.current.edges,
      currentStateRef.current.graph
    );
    setPast((prev) => [...prev, clone]);
    setFuture([]);
  }, []);

  const undo = useCallback(
    (
      setNodes: React.Dispatch<React.SetStateAction<TNode[]>>,
      setEdges: React.Dispatch<React.SetStateAction<TEdge[]>>,
      setGraph: React.Dispatch<React.SetStateAction<TGraph | null>>
    ) => {
      if (past.length === 0) return;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      setPast(newPast);
      
      const currentClone = cloneState(
        currentStateRef.current.nodes,
        currentStateRef.current.edges,
        currentStateRef.current.graph
      );
      setFuture((prev) => [currentClone, ...prev]);

      currentStateRef.current = previous;

      setNodes(previous.nodes);
      setEdges(previous.edges);
      setGraph(previous.graph);
    },
    [past]
  );

  const redo = useCallback(
    (
      setNodes: React.Dispatch<React.SetStateAction<TNode[]>>,
      setEdges: React.Dispatch<React.SetStateAction<TEdge[]>>,
      setGraph: React.Dispatch<React.SetStateAction<TGraph | null>>
    ) => {
      if (future.length === 0) return;

      const next = future[0];
      const newFuture = future.slice(1);

      const currentClone = cloneState(
        currentStateRef.current.nodes,
        currentStateRef.current.edges,
        currentStateRef.current.graph
      );
      setPast((prev) => [...prev, currentClone]);
      setFuture(newFuture);

      currentStateRef.current = next;

      setNodes(next.nodes);
      setEdges(next.edges);
      setGraph(next.graph);
    },
    [future]
  );

  return {
    takeSnapshot,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    updateCurrentState
  };
}
