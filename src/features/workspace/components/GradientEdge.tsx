import {
    BaseEdge,
    getBezierPath,
    getSmoothStepPath,
    getStraightPath,
    type EdgeProps,
    type Position,
} from '@xyflow/react';
import type { EdgeTypeMode, TaskStatus } from '../utils/workspaceUtils';

type GradientEdgeData = {
    shape?: EdgeTypeMode;
    from?: string;
    to?: string;
    sourceStatus?: TaskStatus;
};

interface PathParams {
    sourceX: number;
    sourceY: number;
    sourcePosition: Position;
    targetX: number;
    targetY: number;
    targetPosition: Position;
}

const EDGE_PULSE: Partial<Record<TaskStatus, { duration: string; mult: number }>> = {
    IN_PROGRESS: { duration: '4s', mult: 2.2 },
    AVAILABLE: { duration: '4s', mult: 2.2 },
    COMPLETED: { duration: '6s', mult: 1.7 },
    LOCKED: { duration: '8s', mult: 1.4 },
    SKIPPED: { duration: '8s', mult: 1.4 }
};
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
    const { shape, from, to, sourceStatus } = (data ?? {}) as GradientEdgeData;

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
    const baseWidth = typeof style?.strokeWidth === 'number' ? style.strokeWidth : 1.8;
    const lineOpacity = typeof style?.opacity === 'number' ? style.opacity : 1;
    const glowOpacity = lineOpacity * 0.1;
    const pulse = sourceStatus ? EDGE_PULSE[sourceStatus] : undefined;

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

            <path
                d={path}
                className={`tg-edge-glow${pulse ? ' tg-edge-glow--pulse' : ''}`}
                fill="none"
                stroke={stroke}
                strokeWidth={baseWidth + 7}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    '--tg-glow-opacity': glowOpacity,
                    '--tg-pulse-dur': pulse?.duration ?? '4s',
                    '--tg-pulse-mult': pulse?.mult ?? 1,
                    opacity: glowOpacity,
                    filter: 'blur(18px)',
                    pointerEvents: 'none',
                    transition: 'stroke 0.3s ease, opacity 0.3s ease, d 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                } as React.CSSProperties}
            />

            <BaseEdge path={path} markerEnd={markerEnd} style={{ ...style, stroke }} />
        </>
    );
}
