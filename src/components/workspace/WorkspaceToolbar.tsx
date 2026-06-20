import { Panel } from '@xyflow/react';
import {
  Circle,
  Tag,
  LayoutGrid,
  Spline,
  GitCommit,
  Minus,
  CornerDownRight,
  Network,
  CheckCircle2,
  GitBranch,
  Zap,
  Clock,
  Plus
} from 'lucide-react';
import type { ViewMode, EdgeTypeMode } from '../../utils/workspaceUtils';

const viewModes = [
  { key: 'dot' as const, label: 'Dots', icon: Circle },
  { key: 'label' as const, label: 'Labels', icon: Tag },
  { key: 'full' as const, label: 'Full view', icon: LayoutGrid }
];

const edgeTypeModes = [
  { key: 'smoothstep' as const, label: 'Rounded', icon: Spline },
  { key: 'default' as const, label: 'Curved', icon: GitCommit },
  { key: 'straight' as const, label: 'Straight', icon: Minus },
  { key: 'step' as const, label: 'Step', icon: CornerDownRight }
];

interface WorkspaceToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  edgeType: EdgeTypeMode;
  setEdgeType: (mode: EdgeTypeMode) => void;
  showTopologicalLanes: boolean;
  setShowTopologicalLanes: (show: boolean) => void;
  isAligned: boolean;
  autoArrangeLayout: () => void;
  onCreateTask: () => void;
  graphStats: {
    tasks: number;
    dependencies: number;
    completed: number;
    available: number;
    estimatedHours: number;
    loggedHours: number;
    completion: number;
  };
}

export function WorkspaceToolbar({
  viewMode,
  setViewMode,
  edgeType,
  setEdgeType,
  showTopologicalLanes,
  setShowTopologicalLanes,
  isAligned,
  autoArrangeLayout,
  onCreateTask,
  graphStats
}: WorkspaceToolbarProps) {
  const activeViewIndex = viewModes.findIndex((mode) => mode.key === viewMode);
  const activeViewOffset = activeViewIndex < 0 ? 0 : activeViewIndex;
  const activeEdgeTypeIndex = edgeTypeModes.findIndex((mode) => mode.key === edgeType);
  const activeEdgeTypeOffset = activeEdgeTypeIndex < 0 ? 0 : activeEdgeTypeIndex;

  return (
    <>
      <Panel position="bottom-center" className="!mb-6 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:!w-auto sm:!max-w-[calc(100vw-2rem)]">
        <div className="max-h-[42dvh] max-w-full overflow-hidden rounded-3xl border border-white/10 bg-[#020617]/70 p-1.5 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10 animate-slide-up-fade [animation-delay:250ms] 2xl:rounded-full flex flex-col">
          <div className="flex max-w-full items-center gap-2 overflow-x-auto overscroll-x-contain py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-fade-mask min-[2200px]:scroll-fade-none px-3">

            <div className="relative grid h-full shrink-0 grid-cols-3 items-stretch gap-1" role="tablist">
              <span
                className={`absolute inset-y-0 left-0 w-[calc((100%-0.5rem)/3)] rounded-full bg-gradient-to-r from-brand-500 to-orange-500 shadow-md shadow-brand-500/20 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeViewOffset === 0
                  ? 'translate-x-0'
                  : activeViewOffset === 1
                    ? 'translate-x-[calc(100%+0.25rem)]'
                    : 'translate-x-[calc(200%+0.5rem)]'
                  }`}
              />
              {viewModes.map(({ key, label, icon: Icon }) => {
                const active = viewMode === key;
                return (
                  <button
                    key={key}
                    onClick={() => setViewMode(key)}
                    className={`relative z-10 flex min-w-10 items-center justify-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold whitespace-nowrap transition-colors duration-300 ease-out cursor-pointer 2xl:px-4 ${active
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900'
                      }`}
                    title={label}
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden 2xl:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="h-6 w-px shrink-0 bg-white/10 light:bg-slate-200 mx-0.5 sm:mx-1" />

            <div className="relative grid h-full shrink-0 grid-cols-4 items-stretch gap-1" role="tablist">
              <span
                className={`absolute inset-y-0 left-0 w-[calc((100%-0.75rem)/4)] rounded-full bg-gradient-to-r from-brand-500 to-orange-500 shadow-md shadow-brand-500/20 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeEdgeTypeOffset === 0
                  ? 'translate-x-0'
                  : activeEdgeTypeOffset === 1
                    ? 'translate-x-[calc(100%+0.25rem)]'
                    : activeEdgeTypeOffset === 2
                      ? 'translate-x-[calc(200%+0.5rem)]'
                      : 'translate-x-[calc(300%+0.75rem)]'
                  }`}
              />
              {edgeTypeModes.map(({ key, label, icon: Icon }) => {
                const active = edgeType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setEdgeType(key)}
                    className={`relative z-10 flex min-w-10 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold whitespace-nowrap transition-colors duration-300 ease-out cursor-pointer 2xl:px-4 ${active
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900'
                      }`}
                    title={label}
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden 2xl:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="h-6 w-px shrink-0 bg-white/10 light:bg-slate-200 mx-0.5 sm:mx-1" />

            <button
              onClick={() => setShowTopologicalLanes(!showTopologicalLanes)}
              className={`flex min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-semibold transition-all cursor-pointer 2xl:px-4 ${showTopologicalLanes
                ? 'border-brand-500/40 bg-gradient-to-r from-brand-500/20 to-orange-500/20 text-brand-300 shadow-md shadow-brand-500/5 light:border-brand-500/30 light:bg-gradient-to-r light:from-brand-500/15 light:to-orange-500/15 light:text-brand-700'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-950/5'
                }`}
              title="Toggle topological layers"
              aria-label="Toggle topological layers"
            >
              <Network className="h-4 w-4 shrink-0" />
              <span className="hidden 2xl:inline">Layers</span>
            </button>

            <button
              onClick={autoArrangeLayout}
              className={`flex min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-semibold transition-all cursor-pointer 2xl:px-4 ${isAligned
                ? 'border-brand-500/40 bg-gradient-to-r from-brand-500/20 to-orange-500/20 text-brand-300 shadow-md shadow-brand-500/5 light:border-brand-500/30 light:bg-gradient-to-r light:from-brand-500/15 light:to-orange-500/15 light:text-brand-700'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-950/5'
                }`}
              title="Auto-arrange and align all task nodes by topological layers"
              aria-label="Auto-arrange and align all task nodes by topological layers"
            >
              <LayoutGrid className="h-4 w-4 shrink-0" />
              <span className="hidden 2xl:inline">Align</span>
            </button>

          </div>

          <div className="mt-1.5 flex w-full items-center gap-2 overflow-x-auto overscroll-x-contain border-t border-white/10 px-3 pt-1.5 pb-0.5 text-[11px] font-semibold whitespace-nowrap text-slate-300 [scrollbar-width:none] light:border-slate-200/70 light:text-slate-600 min-[2200px]:!hidden scroll-fade-mask [&::-webkit-scrollbar]:hidden sm:gap-3 lg:grid lg:grid-cols-5 lg:gap-0 lg:overflow-hidden lg:px-0 lg:scroll-fade-none">
            <div className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500/15 to-orange-500/15 px-3 py-2 font-bold text-brand-300 light:text-brand-700 lg:mx-auto lg:min-w-0 lg:shrink">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="lg:truncate">{graphStats.completion}%</span>
            </div>
            <div className="flex shrink-0 items-center justify-center gap-1.5 px-2 py-1.5 lg:min-w-0 lg:shrink lg:px-1.5">
              <Network className="h-4 w-4 shrink-0 text-brand-400 light:text-brand-500" />
              <span className="lg:truncate">{graphStats.tasks} tasks</span>
            </div>
            <div className="flex shrink-0 items-center justify-center gap-1.5 px-2 py-1.5 lg:min-w-0 lg:shrink lg:px-1.5">
              <GitBranch className="h-4 w-4 shrink-0 text-sky-400 light:text-sky-500" />
              <span className="lg:truncate">{graphStats.dependencies} deps</span>
            </div>
            <div className="flex shrink-0 items-center justify-center gap-1.5 px-2 py-1.5 lg:min-w-0 lg:shrink lg:px-1.5">
              <Zap className="h-4 w-4 shrink-0 text-amber-400 light:text-amber-500" />
              <span className="lg:truncate">{graphStats.available} open</span>
            </div>
            <div className="flex shrink-0 items-center justify-center gap-1.5 px-2 py-1.5 lg:min-w-0 lg:shrink lg:px-1.5">
              <Clock className="h-4 w-4 shrink-0 text-violet-400 light:text-violet-500" />
              <span className="lg:truncate">{graphStats.loggedHours}h / {graphStats.estimatedHours}h</span>
            </div>
          </div>
        </div>
      </Panel>

      <Panel position="bottom-right" className="!mb-[145px] lg:!mb-6 !mr-6 z-40 flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={onCreateTask}
          className="group relative flex h-12 w-12 lg:w-auto shrink-0 items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-r from-brand-500 to-orange-500 p-3 lg:px-5 lg:py-3 text-[13px] font-extrabold text-white shadow-lg shadow-brand-500/15 transition-all duration-300 hover:scale-[1.06] hover:shadow-brand-500/25 hover:brightness-110 active:scale-95 cursor-pointer animate-slide-up-fade [animation-delay:300ms]"
          title="Create a new task in the center of the viewport"
          aria-label="Create a new task"
        >
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-brand-500 to-orange-500 opacity-10 blur-[2px] transition-opacity duration-300 group-hover:opacity-20 pointer-events-none" />
          <Plus className="relative z-10 h-5 w-5 shrink-0" />
          <span className="relative z-10 hidden lg:inline">Create Task</span>
        </button>

        <div className="hidden min-[2200px]:flex items-center gap-4 rounded-full border border-white/10 bg-[#020617]/70 p-1.5 pr-6 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10 animate-slide-up-fade [animation-delay:350ms]">
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500/15 to-orange-500/15 px-4 py-2 text-[12px] font-bold whitespace-nowrap text-brand-300 light:text-brand-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>{graphStats.completion}% complete</span>
          </div>

          <div className="h-5 w-px bg-white/10 light:bg-slate-200" />

          <div className="flex items-center gap-5 text-[12px] font-semibold whitespace-nowrap text-slate-300 light:text-slate-600">
            <div className="flex items-center gap-1.5">
              <Network className="h-4 w-4 text-brand-400 light:text-brand-500" />
              <span>{graphStats.tasks} tasks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-4 w-4 text-sky-400 light:text-sky-500" />
              <span>{graphStats.dependencies} deps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400 light:text-amber-500" />
              <span>{graphStats.available} open</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-violet-400 light:text-violet-500" />
              <span>{graphStats.loggedHours}h / {graphStats.estimatedHours}h</span>
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}