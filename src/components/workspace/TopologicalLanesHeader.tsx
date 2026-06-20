import { useStore } from '@xyflow/react';
import type { ViewMode, WorkspaceNode } from '../../utils/workspaceUtils';

interface TopologicalLanesHeaderProps {
  show: boolean;
  columnWidth: number;
  viewMode: ViewMode;
  uniqueLayers: number[];
  nodes: WorkspaceNode[];
}

export function TopologicalLanesHeader({
  show,
  columnWidth,
  viewMode,
  uniqueLayers,
  nodes
}: TopologicalLanesHeaderProps) {
  const transform = useStore((state) => state.transform);
  if (!show || !uniqueLayers || uniqueLayers.length === 0) return null;

  const [tx, , tzoom] = transform;

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none z-30 h-[200px] overflow-hidden">
      {uniqueLayers.map((layer) => {
        const headerNode = nodes.find((n) => n.id === `layer-header-${layer}`);
        const canvasX = headerNode ? headerNode.position.x : (layer * columnWidth + (viewMode === 'dot' ? 22 : viewMode === 'label' ? 146 : 159));

        const screenX = tx + canvasX * tzoom;

        return (
          <div
            key={layer}
            className="absolute transition-opacity duration-300"
            style={{
              left: `${screenX}px`,
              top: '112px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="rounded-full border border-white/10 bg-[#020617]/70 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:text-slate-500 light:shadow-slate-200/10 whitespace-nowrap">
              Layer {layer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
