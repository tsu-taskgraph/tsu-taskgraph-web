import {
    BaseEdge,
    getBezierPath,
    getSmoothStepPath,
    getStraightPath,
    type EdgeProps,
    type Position,
} from '@xyflow/react';
import type { EdgeTypeMode } from '../utils/workspaceUtils';

type GradientEdgeData = {
    shape?: EdgeTypeMode;
    from?: string;
    to?: string;
};

interface PathParams {
    sourceX: number;
    sourceY: number;
    sourcePosition: Position;
    targetX: number;
    targetY: number;
    targetPosition: Position;
}

function buildEdgePath(shape: EdgeTypeMode, p: PathParams): string {
    switch (shape) {
        case 'smoothstep':
            return getSmoothStepPath({ ...p, borderRadius: 8 })[0];
        case 'step':
            return getSmoothStepPath({ ...p, borderRadius: 0 })[0];
        case 'straight':
            return getStraightPath({ sourceX: p.sourceX, sourceY: p.sourceY, targetX: p.targetX, targetY: p.targetY })[0];
        case 'default':
        default:
            return getBezierPath(p)[0];
    }
}

export function GradientEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    data,
}: EdgeProps) {
    const { shape, from, to } = (data ?? {}) as GradientEdgeData;

    const path = buildEdgePath(shape ?? 'default', {
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const gradientId = `tg-edge-grad-${id}`;
    const hasGradient = Boolean(from && to);
    const stroke = hasGradient ? `url(#${gradientId})` : (to ?? from ?? '#94a3b8');

    return (
        <>
            {hasGradient && (
                <defs>
                    <linearGradient
                        id={gradientId}
                        gradientUnits="userSpaceOnUse"
                        x1={sourceX}
                        y1={sourceY}
                        x2={targetX}
                        y2={targetY}
                    >
                        <stop offset="0%" stopColor={from} />
                        <stop offset="100%" stopColor={to} />
                    </linearGradient>
                </defs>
            )}

            <BaseEdge path={path} markerEnd={markerEnd} style={{ ...style, stroke }} />
        </>
    );
}
