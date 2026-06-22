import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Moon, Sun, Sparkles, Loader2, Users } from 'lucide-react';
import type { ProjectResponse, ProjectGraphResponse } from '../../../api/projects';

const projectStatusClass: Record<ProjectResponse['status'], string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 light:bg-emerald-500/15 light:text-emerald-700 light:border-emerald-500/30',
  COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20 light:bg-blue-500/15 light:text-blue-700 light:border-blue-500/30',
  ARCHIVED: 'bg-slate-500/10 text-slate-400 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200',
  PENDING_AI: 'bg-amber-500/10 text-amber-400 border-amber-500/20 light:bg-amber-500/15 light:text-amber-700 light:border-amber-500/30'
};

interface WorkspaceHeaderProps {
  project: ProjectResponse | null;
  graph: ProjectGraphResponse | null;
  loading: boolean;
  refreshing: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onRefresh: () => void;
  onOpenTeam: () => void;
  isScrolled: boolean;
}

export function WorkspaceHeader({
  project,
  graph,
  loading,
  refreshing,
  theme,
  toggleTheme,
  onRefresh,
  onOpenTeam,
  isScrolled
}: WorkspaceHeaderProps) {
  return (
    <div className="sticky top-0 z-40 h-[88px] w-full pointer-events-none sm:h-24">
      <header className={`w-full pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'py-1.5 sm:py-2' : 'py-3 sm:py-4'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`relative z-50 flex h-14 items-center justify-between rounded-2xl border px-4 shadow-lg backdrop-blur-xl transition-all duration-500 sm:h-16 sm:px-6 animate-slide-down-fade ${isScrolled
            ? 'border-brand-500/20 bg-[#020617]/70 shadow-brand-500/5 light:bg-white/75 light:border-brand-500/20'
            : 'border-white/10 bg-[#020617]/70 shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10'
            }`}>
            <div className="flex min-w-0 items-center gap-3">
              <Link
                to="/"
                className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#020617]/45 text-slate-300 backdrop-blur-xl transition-all hover:border-brand-500/30 hover:text-brand-400 light:border-slate-200/60 light:bg-white/45 light:text-slate-600 light:hover:text-brand-600"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </Link>

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-base font-bold tracking-tight text-white light:text-slate-900 sm:text-lg max-w-[120px] sm:max-w-[280px] md:max-w-[420px] lg:max-w-[600px]" title={project?.name}>
                    {project?.name
                      ? (project.name.length > 80 ? `${project.name.slice(0, 80)}...` : project.name)
                      : 'Project Workspace'}
                  </h1>
                  {project && (
                    <span className={`hidden shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-flex ${projectStatusClass[project.status]}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p className="hidden truncate text-xs text-slate-400 light:text-slate-600 sm:block max-w-[180px] sm:max-w-[280px] md:max-w-[420px] lg:max-w-[600px]">
                  {project?.description
                    ? (project.description.length > 120 ? `${project.description.slice(0, 120)}...` : project.description)
                    : 'Interactive task graph · dependencies and execution flow'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {graph && (
                <div className={`hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium backdrop-blur-xl xl:flex ${
                  (graph.enrichmentStatus === 'PENDING' || graph.enrichmentStatus === 'IN_PROGRESS')
                    ? 'border-brand-500/30 bg-brand-500/10 text-brand-400 light:text-brand-600'
                    : 'border-white/10 bg-[#020617]/45 text-slate-400 light:border-slate-200/60 light:bg-white/45 light:text-slate-600'
                }`}>
                  {(graph.enrichmentStatus === 'PENDING' || graph.enrichmentStatus === 'IN_PROGRESS') ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400 light:text-brand-600" />
                      <span>AI enriching tasks...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-slate-400 light:text-slate-600" />
                      <span>Ready</span>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={onOpenTeam}
                disabled={loading}
                className="flex h-9 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 text-xs font-semibold text-slate-400 backdrop-blur-xl transition-all hover:bg-slate-800/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:border-slate-200/60 light:bg-white/45 light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900 w-9 lg:w-auto px-0 lg:px-3 shrink-0"
              >
                <Users className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Team</span>
              </button>
              <button
                onClick={onRefresh}
                disabled={refreshing || loading}
                className="flex h-9 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 text-xs font-semibold text-slate-400 backdrop-blur-xl transition-all hover:bg-slate-800/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:border-slate-200/60 light:bg-white/45 light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900 w-9 lg:w-auto px-0 lg:px-3 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline">Refresh</span>
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-950/45 text-slate-400 backdrop-blur-xl transition-all hover:bg-slate-800/80 hover:text-white active:scale-95 cursor-pointer light:border-slate-200/60 light:bg-white/45 light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900 group shrink-0"
                aria-label="Toggle theme"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? (
                  <Moon className="w-3.5 h-3.5 transition-transform duration-500 rotate-0 group-hover:-rotate-12 group-hover:scale-110" />
                ) : (
                  <Sun className="w-3.5 h-3.5 transition-transform duration-500 rotate-0 group-hover:rotate-90 group-hover:scale-110" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
