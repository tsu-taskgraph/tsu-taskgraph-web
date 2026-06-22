import { AlertCircle, Archive, Check, Loader2, Plus, Save, X } from 'lucide-react';
import type { ProjectResponse } from '../../../api/projects';

interface ProjectSettingsForm {
    name: string;
    description: string;
    techStack: string[];
    status: ProjectResponse['status'];
    aiEstimate: boolean;
}

interface ProjectSettingsModalProps {
    isClosing: boolean;
    project: ProjectResponse;
    form: ProjectSettingsForm;
    currentTechInput: string;
    formError: string | null;
    fieldErrors: { name?: string; description?: string };
    submitting: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onFormChange: (form: ProjectSettingsForm) => void;
    onCurrentTechInputChange: (value: string) => void;
    onAddTag: (tag: string) => void;
    onRemoveTag: (index: number) => void;
}

const inputClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm font-medium text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-brand-500 light:focus:ring-brand-500';

export function ProjectSettingsModal({
    isClosing,
    project,
    form,
    currentTechInput,
    formError,
    fieldErrors,
    submitting,
    onClose,
    onSubmit,
    onFormChange,
    onCurrentTechInputChange,
    onAddTag,
    onRemoveTag
}: ProjectSettingsModalProps) {
    const updateForm = <K extends keyof ProjectSettingsForm>(key: K, value: ProjectSettingsForm[K]) => {
        onFormChange({ ...form, [key]: value });
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm transition-all duration-200 ${isClosing ? 'modal-overlay-exit' : 'animate-slow-fade'}`}
                onClick={onClose}
            />

            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                <form
                    onSubmit={onSubmit}
                    className={`w-full max-w-[560px] rounded-3xl border border-white/10 bg-[#020617]/92 p-6 text-slate-100 shadow-2xl shadow-black/30 backdrop-blur-2xl light:border-slate-200/70 light:bg-white/95 light:text-slate-900 light:shadow-slate-300/30 ${isClosing ? 'modal-content-exit' : 'animate-zoom-in-fade'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 light:border-slate-200/50">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 light:bg-brand-500/10 light:text-brand-600">
                                <Archive className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold tracking-tight">Project settings</h3>
                                <p className="text-xs text-slate-400 light:text-slate-500">Update metadata and lifecycle status</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200 light:text-slate-500 light:hover:bg-slate-950/5 light:hover:text-slate-900"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {formError && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-300 light:text-red-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    <div className="mt-5 grid gap-4">
                        <div className="grid gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => updateForm('name', e.target.value)}
                                className={`${inputClass} ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                placeholder="Project name"
                            />
                            {fieldErrors.name && <span className="text-xs text-red-400">{fieldErrors.name}</span>}
                        </div>

                        <div className="grid gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => updateForm('description', e.target.value)}
                                className={`${inputClass} min-h-[96px] resize-none ${fieldErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                placeholder="Project goal and context"
                            />
                            {fieldErrors.description && <span className="text-xs text-red-400">{fieldErrors.description}</span>}
                        </div>

                        <div className="grid gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tech stack</label>
                            <div className="flex gap-2">
                                <input
                                    value={currentTechInput}
                                    onChange={(e) => onCurrentTechInputChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ',') {
                                            e.preventDefault();
                                            onAddTag(currentTechInput);
                                        }
                                    }}
                                    className={inputClass}
                                    placeholder="React, Spring, PostgreSQL..."
                                />
                                <button
                                    type="button"
                                    onClick={() => onAddTag(currentTechInput)}
                                    className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 text-brand-400 transition hover:bg-brand-500/15 light:text-brand-600"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            {form.techStack.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {form.techStack.map((tag, index) => (
                                        <button
                                            key={`${tag}-${index}`}
                                            type="button"
                                            onClick={() => onRemoveTag(index)}
                                            className="group rounded-lg border border-brand-500/20 bg-brand-500/10 px-2 py-1 text-[11px] font-semibold text-brand-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 light:text-brand-700 light:hover:text-red-700"
                                            title="Remove tag"
                                        >
                                            {tag} <span className="opacity-50 group-hover:opacity-100">×</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => updateForm('status', e.target.value as ProjectResponse['status'])}
                                    className={inputClass}
                                >
                                    <option value="PENDING_AI">PENDING AI</option>
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="ARCHIVED">ARCHIVED</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-200 light:border-slate-200 light:bg-slate-50 light:text-slate-800">
                                <input
                                    type="checkbox"
                                    checked={form.aiEstimate}
                                    onChange={(e) => updateForm('aiEstimate', e.target.checked)}
                                    className="h-4 w-4 accent-brand-500"
                                />
                                AI estimates enabled
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/5 pt-4 light:border-slate-200/50">
                        <span className="text-[11px] text-slate-500">Version: {project.version ?? 'not provided'}</span>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="group relative h-10 px-5 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:pointer-events-none transition-all duration-300 cursor-pointer overflow-hidden shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 shrink-0 disabled:bg-gradient-to-r disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 light:disabled:from-slate-200 light:disabled:to-slate-200 light:disabled:text-slate-400 disabled:shadow-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-orange-600 transition-opacity duration-300 group-disabled:opacity-0" />
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-disabled:opacity-0" />
                            {submitting ? <Loader2 className="relative z-10 h-3.5 w-3.5 animate-spin" /> : <Save className="relative z-10 h-3.5 w-3.5" />}
                            <span className="relative z-10">Save changes</span>
                            {!submitting && <Check className="relative z-10 h-3.5 w-3.5" />}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
