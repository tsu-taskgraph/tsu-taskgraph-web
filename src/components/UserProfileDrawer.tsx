import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { X, Camera, Trash2, Loader2, User, Mail, Check } from 'lucide-react';
import { SafariTopBar } from './SafariTopBar';
import { SafariBottomBar } from './SafariBottomBar';
import axios from 'axios';
import { mapServerErrorToEnglish } from '../api/errors';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileDrawer({ isOpen, onClose }: UserProfileDrawerProps) {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ displayName?: string }>({});
  const [shakeToggle, setShakeToggle] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setFieldErrors({});
      setDisplayName(user?.displayName || '');
    }
  }, [isOpen]);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  if (!user) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!displayName.trim()) {
      setFieldErrors({ displayName: 'Display name is required.' });
      setShakeToggle(prev => !prev);
      return;
    }

    if (displayName === user.displayName) return;

    setFieldErrors({});
    setIsSavingName(true);

    try {
      const updatedUser = await authApi.updateProfile({ displayName: displayName.trim() });
      updateUser(updatedUser);
      setSuccess('Name successfully updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, status);
      setError(parsed.message || 'Failed to update name.');
      setShakeToggle(prev => !prev);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await authApi.uploadAvatar(file);
      updateUser(updatedUser);
      setSuccess('Avatar successfully updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, status);
      setError(parsed.message || 'Failed to upload avatar.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user.avatarUrl || isDeletingAvatar) return;

    setIsDeletingAvatar(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await authApi.deleteAvatar();
      updateUser(updatedUser);
      setSuccess('Avatar successfully deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, status);
      setError(parsed.message || 'Failed to delete avatar.');
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const isNameUnchanged = displayName.trim() === user.displayName || !displayName.trim();

  return (
    <>
      {isOpen && (
        <>
          <div className="md:hidden">
            <SafariTopBar colorClass="light:bg-black/60" zIndexClass="z-[10000]" />
            <SafariBottomBar colorClass="light:bg-[#59585E]" zIndexClass="z-[10000]" />
          </div>

          <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-950 light:from-[#616264] to-transparent pointer-events-none z-60" />
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 light:from-[#59585E] to-transparent pointer-events-none z-60" />
        </>
      )}

      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:max-w-md bg-slate-950/95 light:bg-white/95 border-l border-white/10 light:border-slate-200 shadow-2xl backdrop-blur-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5 light:border-slate-200/80">
          <h2 className="text-lg font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            <User className="h-5 w-5 text-brand-500" />
            User Profile
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-400 font-medium flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-400 font-medium flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative group h-28 w-28 rounded-full border-2 cursor-pointer transition-all duration-300 overflow-hidden flex items-center justify-center
                ${isDragOver
                  ? 'border-brand-500 bg-brand-500/10 scale-105'
                  : 'border-white/10 hover:border-brand-500/50 light:border-slate-200 light:hover:border-brand-500/60 bg-slate-900/50 light:bg-slate-50/50'
                }`}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <span className="text-3xl font-extrabold text-brand-400 light:text-brand-600">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </span>
              )}

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1 text-[10px] text-white font-medium">
                <Camera className="h-5 w-5 text-brand-400" />
                <span>Upload photo</span>
              </div>

              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-brand-500 animate-spin" />
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-900/60 border border-white/5 hover:border-brand-500/30 text-slate-300 transition-all cursor-pointer hover:bg-slate-800/60 light:bg-slate-50 light:border-slate-200 light:text-slate-700 light:hover:bg-slate-100 flex items-center gap-1 disabled:opacity-50"
              >
                Choose file
              </button>

              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={isDeletingAvatar || isUploadingAvatar}
                  className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 transition-all cursor-pointer hover:bg-red-500/20 flex items-center gap-1 disabled:opacity-50"
                  title="Delete avatar"
                >
                  {isDeletingAvatar ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Delete
                </button>
              )}
            </div>

            <span className="text-[10px] text-slate-500 text-center max-w-[200px]">
              JPEG, PNG, WEBP or GIF, max. 5 MB. Drag and drop image to the avatar area.
            </span>
          </div>

          <hr className="border-white/5 light:border-slate-200/80" />

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                Email
              </label>
              <input
                type="text"
                value={user.email}
                disabled
                className="w-full bg-slate-900/30 light:bg-slate-100 border border-white/5 light:border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 light:text-slate-500 cursor-not-allowed"
              />
            </div>

            <form onSubmit={handleSaveName} className="flex flex-col gap-5">
              <div className={`flex flex-col gap-1.5 transition-all ${fieldErrors.displayName ? (shakeToggle ? 'animate-shake' : 'animate-shake-alt') : ''}`}>
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    Display Name
                  </label>
                  {fieldErrors.displayName && (
                    <span className="text-[10px] text-red-400 font-medium animate-error-pop">{fieldErrors.displayName}</span>
                  )}
                </div>

                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setFieldErrors(prev => ({ ...prev, displayName: undefined }));
                  }}
                  placeholder="Enter your name"
                  className={`w-full bg-slate-950 light:bg-slate-50 light:focus:bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:outline-none transition-all duration-300 focus:ring-1 ${fieldErrors.displayName
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500 light:border-slate-200 light:focus:border-brand-500 light:focus:ring-brand-500'
                    }`}
                />
              </div>

              <button
                type="submit"
                disabled={isNameUnchanged || isSavingName}
                className="group relative h-10 px-5 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:pointer-events-none transition-all duration-300 cursor-pointer overflow-hidden shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 shrink-0 mt-2 disabled:bg-gradient-to-r disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 light:disabled:from-slate-200 light:disabled:to-slate-200 light:disabled:text-slate-400 disabled:shadow-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-orange-600 transition-opacity duration-300 group-disabled:opacity-0" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-disabled:opacity-0" />

                {isSavingName && <Loader2 className="relative z-10 h-3.5 w-3.5 animate-spin" />}
                <span className="relative z-10">Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
