import { Folder, Activity, CheckCircle2, Clock } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    total: number;
    active: number;
    completed: number;
    hours: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-900/40 light:bg-white/60 backdrop-blur-xl border border-white/10 light:border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-black/10 light:shadow-slate-200/30 hover:border-brand-500/20 light:hover:border-brand-500/30 transition-all duration-300">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Projects</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 mt-1">{stats.total}</span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-brand-500/10 light:bg-brand-500/15 text-brand-400 light:text-brand-600 flex items-center justify-center">
          <Folder className="h-5 w-5" />
        </div>
      </div>

      <div className="bg-slate-900/40 light:bg-white/60 backdrop-blur-xl border border-white/10 light:border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-black/10 light:shadow-slate-200/30 hover:border-brand-500/20 light:hover:border-brand-500/30 transition-all duration-300">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 mt-1">{stats.active}</span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 light:bg-amber-500/15 text-amber-400 light:text-amber-600 flex items-center justify-center">
          <Activity className="h-5 w-5" />
        </div>
      </div>

      <div className="bg-slate-900/40 light:bg-white/60 backdrop-blur-xl border border-white/10 light:border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-black/10 light:shadow-slate-200/30 hover:border-brand-500/20 light:hover:border-brand-500/30 transition-all duration-300">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 mt-1">{stats.completed}</span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 light:bg-emerald-500/15 text-emerald-400 light:text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>

      <div className="bg-slate-900/40 light:bg-white/60 backdrop-blur-xl border border-white/10 light:border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-black/10 light:shadow-slate-200/30 hover:border-brand-500/20 light:hover:border-brand-500/30 transition-all duration-300">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Time Logged</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 mt-1">{stats.hours.toFixed(1)}h</span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-sky-500/10 light:bg-sky-500/15 text-sky-400 light:text-sky-600 flex items-center justify-center">
          <Clock className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
