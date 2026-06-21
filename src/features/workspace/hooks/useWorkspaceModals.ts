import { useState, useCallback } from 'react';
import { type ReactFlowInstance } from '@xyflow/react';
import {
  type WorkspaceNode,
  type TaskFlowEdge,
  type TaskCreatorMode,
  type TaskDraftPosition,
} from '../utils/workspaceUtils';

interface UseWorkspaceModalsProps {
  flowInstance: ReactFlowInstance<WorkspaceNode, TaskFlowEdge> | null;
}

export function useWorkspaceModals({ flowInstance }: UseWorkspaceModalsProps) {
  const [taskDraftPosition, setTaskDraftPosition] = useState<TaskDraftPosition | null>(null);
  const [taskCreatorMode, setTaskCreatorMode] = useState<TaskCreatorMode>('context');
  const [taskCreatorAnimationKey, setTaskCreatorAnimationKey] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const [taskActionsModalTaskId, setTaskActionsModalTaskId] = useState<string | null>(null);
  const [isActionsModalClosing, setIsActionsModalClosing] = useState(false);
  const [actionsModalAnimationKey, setActionsModalAnimationKey] = useState(0);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);
  const [isConfirmClosing, setIsConfirmClosing] = useState(false);

  const [statusMenu, setStatusMenu] = useState<{ taskId: string; screen: { x: number; y: number } } | null>(null);

  const openTaskCreator = useCallback((screenX?: number, screenY?: number, mode: TaskCreatorMode = 'context') => {
    const fallbackScreen = {
      x: Math.round(window.innerWidth / 2),
      y: Math.round(window.innerHeight / 2)
    };
    const screen = {
      x: screenX ?? fallbackScreen.x,
      y: screenY ?? fallbackScreen.y
    };
    const flow = flowInstance?.screenToFlowPosition(screen) ?? { x: 0, y: 0 };

    const maxPopoverX = Math.max(12, window.innerWidth - 372);
    const maxPopoverY = Math.max(96, window.innerHeight - 432);

    setStatusMenu(null);
    setTaskCreatorMode(mode);
    setTaskCreatorAnimationKey((key) => key + 1);
    setTaskDraftPosition({
      screen: {
        x: Math.min(Math.max(screen.x, 12), maxPopoverX),
        y: Math.min(Math.max(screen.y, 96), maxPopoverY)
      },
      flow: {
        x: Math.round(flow.x),
        y: Math.round(flow.y)
      }
    });
  }, [flowInstance]);

  const closeTaskCreator = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setTaskDraftPosition(null);
      setIsClosing(false);
    }, 200);
  }, []);

  const openTaskActionsModal = useCallback((taskId: string) => {
    setStatusMenu(null);
    setTaskDraftPosition(null);
    setActionsModalAnimationKey((key) => key + 1);
    setTaskActionsModalTaskId(taskId);
  }, []);

  const closeTaskActionsModal = useCallback(() => {
    setIsActionsModalClosing(true);
    setTimeout(() => {
      setTaskActionsModalTaskId(null);
      setIsActionsModalClosing(false);
    }, 200);
  }, []);

  return {
    taskDraftPosition,
    setTaskDraftPosition,
    taskCreatorMode,
    setTaskCreatorMode,
    taskCreatorAnimationKey,
    setTaskCreatorAnimationKey,
    isClosing,
    setIsClosing,
    taskActionsModalTaskId,
    setTaskActionsModalTaskId,
    isActionsModalClosing,
    setIsActionsModalClosing,
    actionsModalAnimationKey,
    setActionsModalAnimationKey,
    confirmModal,
    setConfirmModal,
    isConfirmClosing,
    setIsConfirmClosing,
    statusMenu,
    setStatusMenu,
    openTaskCreator,
    closeTaskCreator,
    openTaskActionsModal,
    closeTaskActionsModal
  };
}
