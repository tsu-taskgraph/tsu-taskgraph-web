import React, { useState } from 'react';
import { X, UserPlus, Loader2, Mail } from 'lucide-react';
import { type ProjectMember } from '../../../api/projects';

interface InviteMemberModalProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  onInvite: (email: string, role: ProjectMember['role']) => Promise<void>;
}

export function InviteMemberModal({
  isOpen,
  isClosing,
  onClose,
  onInvite
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectMember['role']>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      await onInvite(email.trim(), role);
      setEmail('');
      setRole('MEMBER');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send invitation.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[95] bg-slate-950/75 backdrop-blur-sm transition-all duration-200 ${
          isClosing ? 'modal-overlay-exit' : 'animate-slow-fade'
        }`}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
        <div
          className={`w-full max-w-[400px] rounded-3xl border border-white/10 bg-[#020617]/95 p-6 text-slate-100 shadow-2xl shadow-black/35 backdrop-blur-2xl light:border-slate-200/70 light:bg-white/95 light:text-slate-900 light:shadow-slate-300/35 ${
            isClosing ? 'modal-content-exit' : 'animate-zoom-in-fade'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4 light:border-slate-200/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 light:bg-brand-500/10 light:text-brand-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Invite Member</h3>
                <p className="text-xs text-slate-400 light:text-slate-500">
                  Invite a collaborator to this project
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-xl p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200 light:text-slate-500 light:hover:bg-slate-950/5 light:hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 light:text-slate-500">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 light:border-slate-200 light:bg-slate-50 light:text-slate-900 light:placeholder-slate-400"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 light:text-slate-500">
                Project Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ProjectMember['role'])}
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-2.5 text-sm text-slate-200 outline-none transition focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 light:border-slate-200 light:bg-slate-50 light:text-slate-800"
              >
                <option value="ADMIN">ADMIN (Can invite and update tasks)</option>
                <option value="MEMBER">MEMBER (Can view and update tasks)</option>
                <option value="VIEWER">VIEWER (Read-only access)</option>
              </select>
            </div>

            {error && (
              <div className="text-xs font-semibold text-red-400 light:text-red-600">
                {error}
              </div>
            )}

            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-200 light:text-slate-600 light:hover:bg-slate-950/5 light:hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/10 transition hover:brightness-105 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Inviting...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Invite</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
