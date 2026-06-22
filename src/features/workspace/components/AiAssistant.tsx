import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Loader2, Bot, CornerDownLeft } from 'lucide-react';

interface AiAssistantProps {
  onMutate: (prompt: string) => Promise<void>;
}

export function AiAssistant({ onMutate }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      await onMutate(prompt.trim());
      setPrompt('');
      setIsOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to apply AI mutation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={panelRef} className="relative flex flex-col items-end z-[45]">
      {isOpen && (
        <div className="mb-3 w-[300px] sm:w-[340px] overflow-hidden rounded-3xl border border-white/10 bg-[#020617]/85 p-4 text-slate-100 shadow-2xl shadow-black/30 backdrop-blur-2xl transition-all duration-300 light:border-slate-200/70 light:bg-white/95 light:text-slate-900 light:shadow-slate-300/30 animate-zoom-in-fade">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 light:border-slate-200/50">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-r from-brand-500/20 to-orange-500/20 text-brand-400 light:text-brand-600">
                <Bot className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold tracking-tight">AI Assistant</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200 light:hover:bg-slate-950/5 light:hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2.5">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Add Redis tasks for caching"
                disabled={loading}
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/50 p-3 pr-8 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 light:border-slate-200 light:bg-slate-50 light:text-slate-900 light:placeholder-slate-400 light:focus:border-brand-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit(e);
                  }
                }}
              />
              <div className="absolute right-2.5 bottom-2.5 hidden sm:flex items-center gap-1 text-[9px] font-medium text-slate-500 pointer-events-none">
                <span>Enter</span>
                <CornerDownLeft className="h-2.5 w-2.5" />
              </div>
            </div>

            {error && (
              <div className="text-[11px] font-semibold text-red-400 light:text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-orange-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/10 transition hover:brightness-105 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Mutating Graph...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Mutate Graph</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/20 bg-[#020617]/70 p-3 text-brand-400 shadow-lg border border-brand-500/20 backdrop-blur-md transition-all duration-300 hover:scale-[1.06] hover:text-brand-300 hover:border-brand-500/40 active:scale-95 cursor-pointer light:bg-white/80 light:shadow-slate-300/20`}
        title="Open AI Assistant"
        aria-label="Open AI Assistant"
      >
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-brand-500 to-orange-500 opacity-5 blur-[2px] transition-opacity duration-300 group-hover:opacity-10 pointer-events-none" />
        {isOpen ? (
          <X className="relative z-10 h-5 w-5 shrink-0" />
        ) : (
          <Bot className="relative z-10 h-5 w-5 shrink-0 animate-pulse" />
        )}
      </button>
    </div>
  );
}
