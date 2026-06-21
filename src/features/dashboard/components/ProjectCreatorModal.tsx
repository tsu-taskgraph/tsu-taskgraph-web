import { BookOpen, X, Plus, Loader2 } from 'lucide-react';
import { SafariTopBar } from '../../../components/common/SafariTopBar';
import { SafariBottomBar } from '../../../components/common/SafariBottomBar';

interface ProjectCreatorModalProps {
  isClosing: boolean;
  closeModal: () => void;
  formError: string | null;
  fieldErrors: { name?: string; description?: string };
  shakeToggle: boolean;
  form: {
    name: string;
    description: string;
    techStack: string[];
  };
  currentTechInput: string;
  submitting: boolean;
  handleNameChange: (name: string) => void;
  handleDescriptionChange: (desc: string) => void;
  setCurrentTechInput: (val: string) => void;
  addTag: (tagText: string) => void;
  removeTag: (index: number) => void;
  handleCreateProject: (e: React.FormEvent) => void;
}

export function ProjectCreatorModal({
  isClosing,
  closeModal,
  formError,
  fieldErrors,
  shakeToggle,
  form,
  currentTechInput,
  submitting,
  handleNameChange,
  handleDescriptionChange,
  setCurrentTechInput,
  addTag,
  removeTag,
  handleCreateProject
}: ProjectCreatorModalProps) {
  return (
    <>
      <div className="md:hidden">
        <SafariTopBar colorClass="light:bg-black/60" zIndexClass="z-[10000]" />
        <SafariBottomBar colorClass="light:bg-[#59585E]" zIndexClass="z-[10000]" />
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-950 light:from-[#616264] to-transparent pointer-events-none z-60" />
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 light:from-[#59585E] to-transparent pointer-events-none z-60" />

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-200 ${
        isClosing ? 'modal-overlay-exit' : 'animate-fade-in'
      }`}>
        <div
          className={`bg-slate-900/90 light:bg-white/95 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-lg p-6 ${
            isClosing ? 'modal-content-exit' : 'animate-zoom-in-fade'
          } ${shakeToggle && !fieldErrors.name && !fieldErrors.description ? 'animate-shake' : ''}`}
        >
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5 light:border-slate-200/80">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-500" />
              <h3 className="text-lg font-bold text-white light:text-slate-900 tracking-tight">Create New Project</h3>
            </div>
            <button
              onClick={closeModal}
              className="h-6 w-6 rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-xs text-red-400 font-medium flex items-center gap-2">
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateProject} className="flex flex-col gap-4">

            <div className={`flex flex-col gap-1.5 transition-all ${
              fieldErrors.name ? (shakeToggle ? 'animate-shake' : 'animate-shake-alt') : ''
            }`}>
              <div className="flex justify-between items-baseline">
                <label htmlFor="proj-name" className="text-xs font-semibold text-slate-400 light:text-slate-500">
                  Project Name <span className="text-brand-500">*</span>
                </label>
                {fieldErrors.name && (
                  <span className="text-[10px] text-red-400 font-medium animate-error-pop">{fieldErrors.name}</span>
                )}
              </div>
              <input
                id="proj-name"
                type="text"
                placeholder="e.g. My Awesome Startup"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                className={`w-full bg-slate-950 light:bg-slate-50 light:focus:bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:outline-none transition-all duration-300 focus:ring-1 ${
                  fieldErrors.name
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500 light:border-slate-200 light:focus:border-brand-500 light:focus:ring-brand-500'
                }`}
              />
            </div>

            <div className={`flex flex-col gap-1.5 transition-all ${
              fieldErrors.description ? (shakeToggle ? 'animate-shake' : 'animate-shake-alt') : ''
            }`}>
              <div className="flex justify-between items-baseline">
                <label htmlFor="proj-desc" className="text-xs font-semibold text-slate-400 light:text-slate-500">
                  Description <span className="text-brand-500">*</span>
                </label>
                {fieldErrors.description && (
                  <span className="text-[10px] text-red-400 font-medium animate-error-pop">{fieldErrors.description}</span>
                )}
              </div>
              <textarea
                id="proj-desc"
                rows={3}
                placeholder="Describe the goals, stack, and scope of your project..."
                value={form.description}
                onChange={e => handleDescriptionChange(e.target.value)}
                className={`w-full bg-slate-950 light:bg-slate-50 light:focus:bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:outline-none transition-all duration-300 resize-none focus:ring-1 ${
                  fieldErrors.description
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500 light:border-slate-200 light:focus:border-brand-500 light:focus:ring-brand-500'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="proj-tech" className="text-xs font-semibold text-slate-400 light:text-slate-500">
                Technologies / Tech Stack
              </label>
              <div className="w-full bg-slate-950 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl px-3 py-2 flex flex-wrap gap-2 items-center focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all duration-300 min-h-[44px]">
                {form.techStack.map((tech, idx) => (
                  <span
                    key={`${tech}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/25 rounded-lg animate-zoom-in-fade light:bg-brand-500/10 light:text-brand-700 light:border-brand-500/20"
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(idx)}
                      className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800/80 light:text-slate-400 light:hover:bg-slate-200 light:hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </span>
                ))}
                <div className="flex-1 flex items-center min-w-[140px] gap-2">
                  <input
                    id="proj-tech"
                    type="text"
                    placeholder={form.techStack.length === 0 ? "e.g. React (press Enter or comma to add)" : ""}
                    value={currentTechInput}
                    onChange={e => {
                      const val = e.target.value;
                      if (val.endsWith(',')) {
                        addTag(val);
                      } else {
                        setCurrentTechInput(val);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(currentTechInput);
                      } else if (e.key === 'Backspace' && !currentTechInput) {
                        if (form.techStack.length > 0) {
                          removeTag(form.techStack.length - 1);
                        }
                      }
                    }}
                    onBlur={() => {
                      addTag(currentTechInput);
                    }}
                    className="flex-1 bg-transparent border-0 p-0 text-sm text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:ring-0 focus:outline-none"
                  />
                  {currentTechInput.trim() && (
                    <button
                      type="button"
                      onMouseDown={e => {
                        e.preventDefault();
                      }}
                      onClick={() => addTag(currentTechInput)}
                      className="p-1.5 rounded-lg text-brand-400 hover:bg-slate-800/80 hover:text-white light:text-brand-600 light:hover:bg-brand-500/10 light:hover:text-brand-700 transition-colors cursor-pointer shrink-0"
                      title="Add technology"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-white/5 light:border-slate-200/80">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="group relative h-10 px-5 text-sm font-semibold rounded-xl flex items-center justify-center active:scale-[0.98] disabled:opacity-50 transition-all duration-300 cursor-pointer overflow-hidden border border-slate-700 light:border-slate-200"
              >
                <div className="absolute inset-0 bg-slate-800/20 light:bg-slate-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 text-slate-300 light:text-slate-600 group-hover:text-white light:group-hover:text-slate-900 transition-colors duration-300">Cancel</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="group relative h-10 px-5 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none transition-all duration-300 cursor-pointer overflow-hidden shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-orange-600 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {submitting && (
                  <Loader2 className="relative z-10 h-3.5 w-3.5 animate-spin" />
                )}
                <span className="relative z-10">Create</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
