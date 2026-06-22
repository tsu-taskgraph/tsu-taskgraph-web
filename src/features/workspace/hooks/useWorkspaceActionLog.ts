import { useCallback, useState } from 'react';
import axios from 'axios';
import { projectsApi, type ActionLogEntry } from '../../../api/projects';
import { mapServerErrorToEnglish } from '../../../api/errors';

interface UseWorkspaceActionLogProps {
    projectId: string | undefined;
    showEdgeToast: (message: string, variant?: 'success' | 'error') => void;
}

export function useWorkspaceActionLog({ projectId, showEdgeToast }: UseWorkspaceActionLogProps) {
    const [isActionLogOpen, setIsActionLogOpen] = useState(false);
    const [isActionLogClosing, setIsActionLogClosing] = useState(false);
    const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([]);
    const [loadingActionLogs, setLoadingActionLogs] = useState(false);
    const [actionLogError, setActionLogError] = useState<string | null>(null);

    const loadActionLogs = useCallback(async () => {
        if (!projectId) return;
        setLoadingActionLogs(true);
        setActionLogError(null);
        try {
            const response = await projectsApi.getActionLog(projectId, { size: 100 });
            setActionLogs(response.content);
        } catch (err) {
            const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
            const parsed = mapServerErrorToEnglish(err, statusCode);
            setActionLogError(parsed.message);
            showEdgeToast(parsed.message);
        } finally {
            setLoadingActionLogs(false);
        }
    }, [projectId, showEdgeToast]);

    const openActionLog = useCallback(() => {
        setIsActionLogOpen(true);
        setIsActionLogClosing(false);
        void loadActionLogs();
    }, [loadActionLogs]);

    const closeActionLog = useCallback(() => {
        setIsActionLogClosing(true);
        setTimeout(() => {
            setIsActionLogOpen(false);
            setIsActionLogClosing(false);
        }, 200);
    }, []);

    return {
        isActionLogOpen,
        isActionLogClosing,
        actionLogs,
        loadingActionLogs,
        actionLogError,
        openActionLog,
        closeActionLog,
        loadActionLogs
    };
}
