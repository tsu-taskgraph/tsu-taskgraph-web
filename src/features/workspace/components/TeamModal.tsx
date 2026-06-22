import { X, UserPlus, Trash2, Shield, User } from 'lucide-react';
import { type ProjectMember } from '../../../api/projects';

interface TeamModalProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  members: ProjectMember[];
  currentUserId: string | undefined;
  onRoleChange: (userId: string, newRole: ProjectMember['role']) => Promise<void>;
  onRemoveMember: (userId: string) => void;
  onOpenInvite: () => void;
}

export function TeamModal({
  isOpen,
  isClosing,
  onClose,
  members,
  currentUserId,
  onRoleChange,
  onRemoveMember,
  onOpenInvite
}: TeamModalProps) {
  if (!isOpen) return null;

  const currentUserMember = members.find((m) => m.userId === currentUserId);
  const currentUserRole = currentUserMember?.role;
  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  return (
    <>
      <div
        className={`fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm transition-all duration-200 ${
          isClosing ? 'modal-overlay-exit' : 'animate-slow-fade'
        }`}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className={`w-full max-w-[500px] rounded-3xl border border-white/10 bg-[#020617]/90 p-6 text-slate-100 shadow-2xl shadow-black/30 backdrop-blur-2xl light:border-slate-200/70 light:bg-white/95 light:text-slate-900 light:shadow-slate-300/30 ${
            isClosing ? 'modal-content-exit' : 'animate-zoom-in-fade'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4 light:border-slate-200/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 light:bg-brand-500/10 light:text-brand-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Project Team</h3>
                <p className="text-xs text-slate-400 light:text-slate-500">
                  Manage members and role permissions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200 light:text-slate-500 light:hover:bg-slate-950/5 light:hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 light:text-slate-500">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
            {canManage && (
              <button
                onClick={onOpenInvite}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-orange-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/10 transition hover:brightness-105 active:scale-[0.985]"
              >
                <UserPlus className="h-4 w-4" />
                <span>Invite Member</span>
              </button>
            )}
          </div>

          <div className="mt-4 max-h-[320px] overflow-y-auto pr-1 workspace-sidebar-scroll space-y-3">
            {members.map((member) => {
              const isSelf = member.userId === currentUserId;
              const isTargetOwner = member.role === 'OWNER';
              const canEditThisMember = canManage && !isTargetOwner && !isSelf;

              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-slate-950/20 p-3 light:border-slate-200/50 light:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-sm font-bold text-brand-400 light:bg-brand-500/10 light:text-brand-600 shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold">
                          {member.displayName}
                        </span>
                        {isSelf && (
                          <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] font-bold text-slate-300 light:bg-slate-200 light:text-slate-600">
                            You
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-400 light:text-slate-500">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {canEditThisMember ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          void onRoleChange(member.userId, e.target.value as ProjectMember['role'])
                        }
                        className="rounded-xl border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 outline-none transition focus:border-brand-500/50 light:border-slate-200 light:bg-white light:text-slate-800"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MEMBER">MEMBER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    ) : (
                      <span className="rounded-lg bg-slate-900/60 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-300 border border-white/5 light:bg-slate-200/50 light:text-slate-700 light:border-slate-200">
                        {member.role}
                      </span>
                    )}

                    {canManage && !isTargetOwner && !isSelf && (
                      <button
                        onClick={() => void onRemoveMember(member.userId)}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 light:text-slate-500 light:hover:text-red-600 light:hover:bg-red-50"
                        title="Remove member from project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
