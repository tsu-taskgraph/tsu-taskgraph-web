import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { projectsApi, type ProjectMember } from '../../../api/projects';
import { mapServerErrorToEnglish } from '../../../api/errors';

interface UseWorkspaceMembersProps {
  projectId: string | undefined;
  showEdgeToast: (message: string, variant?: 'success' | 'error') => void;
  setConfirmModal: (modal: {
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null) => void;
  setIsConfirmClosing: (closing: boolean) => void;
}

export function useWorkspaceMembers({
  projectId,
  showEdgeToast,
  setConfirmModal,
  setIsConfirmClosing
}: UseWorkspaceMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isTeamClosing, setIsTeamClosing] = useState(false);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviteClosing, setIsInviteClosing] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!projectId) return;
    setLoadingMembers(true);
    try {
      const data = await projectsApi.listProjectMembers(projectId);
      setMembers(data);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      showEdgeToast(parsed.message);
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId, showEdgeToast]);

  useEffect(() => {
    if (projectId) {
      void loadMembers();
    } else {
      setMembers([]);
    }
  }, [projectId, loadMembers]);

  const openTeamModal = useCallback(() => {
    setIsTeamOpen(true);
    setIsTeamClosing(false);
    void loadMembers();
  }, [loadMembers]);

  const closeTeamModal = useCallback(() => {
    setIsTeamClosing(true);
    setTimeout(() => {
      setIsTeamOpen(false);
      setIsTeamClosing(false);
    }, 200);
  }, []);

  const openInviteModal = useCallback(() => {
    setIsInviteOpen(true);
    setIsInviteClosing(false);
  }, []);

  const closeInviteModal = useCallback(() => {
    setIsInviteClosing(true);
    setTimeout(() => {
      setIsInviteOpen(false);
      setIsInviteClosing(false);
    }, 200);
  }, []);

  const handleRoleChange = useCallback(async (userId: string, newRole: ProjectMember['role']) => {
    if (!projectId) return;
    try {
      await projectsApi.updateMemberRole(projectId, userId, { role: newRole });
      setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role: newRole } : m));
      showEdgeToast('Member role updated successfully.', 'success');
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      showEdgeToast(parsed.message);
    }
  }, [projectId, showEdgeToast]);

  const handleRemoveMember = useCallback((userId: string) => {
    const targetMember = members.find(m => m.userId === userId);
    if (!targetMember) return;

    setConfirmModal({
      title: 'Remove team member',
      message: `Are you sure you want to remove ${targetMember.displayName} (${targetMember.email}) from the project team?`,
      isDestructive: true,
      onConfirm: async () => {
        setIsConfirmClosing(true);
        setTimeout(() => {
          setConfirmModal(null);
          setIsConfirmClosing(false);
        }, 200);

        if (!projectId) return;
        try {
          await projectsApi.removeMember(projectId, userId);
          setMembers(prev => prev.filter(m => m.userId !== userId));
          showEdgeToast('Member removed from team.', 'success');
        } catch (err) {
          const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
          const parsed = mapServerErrorToEnglish(err, statusCode);
          showEdgeToast(parsed.message);
        }
      }
    });
  }, [projectId, members, setConfirmModal, setIsConfirmClosing, showEdgeToast]);

  const handleInviteMember = useCallback(async (email: string, role: ProjectMember['role']) => {
    if (!projectId) return;
    await projectsApi.inviteMember(projectId, { email, role });
    showEdgeToast('Invitation sent successfully.', 'success');
    void loadMembers();
  }, [projectId, loadMembers, showEdgeToast]);

  return {
    members,
    loadingMembers,
    isTeamOpen,
    isTeamClosing,
    isInviteOpen,
    isInviteClosing,
    openTeamModal,
    closeTeamModal,
    openInviteModal,
    closeInviteModal,
    handleRoleChange,
    handleRemoveMember,
    handleInviteMember
  };
}
