import { Clock, Users } from 'lucide-react';
import { type ProjectResponse } from '../../../api/projects';

interface ProjectCardProps {
  project: ProjectResponse;
  onClick: () => void;
  idx: number;
}

export function ProjectCard({ project, onClick, idx }: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer bg-slate-900/40 light:bg-white/60 backdrop-blur-2xl border border-white/10 light:border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-black/20 light:shadow-slate-200/20 hover:border-brand-500/30 light:hover:border-brand-500/40 transition-all duration-300 hover:-translate-y-1 animate-slide-up-fade"
      style={{ animationDelay: `${idx * 40}ms` }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500/0 via-brand-500/3 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      <div>
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-base font-bold text-slate-100 light:text-slate-900 group-hover:text-brand-400 light:group-hover:text-brand-600 transition-colors tracking-tight line-clamp-1">
            {project.name}
          </h3>
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border shrink-0 ${
            project.status === 'ACTIVE'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 light:bg-emerald-500/15 light:text-emerald-700 light:border-emerald-500/30'
              : project.status === 'COMPLETED'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 light:bg-blue-500/15 light:text-blue-700 light:border-blue-500/30'
                : project.status === 'ARCHIVED'
                  ? 'bg-slate-500/10 text-slate-400 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20 light:bg-amber-500/15 light:text-amber-700 light:border-amber-500/30'
          }`}>
            {project.status.replace('_', ' ')}
          </span>
        </div>

        <p className="text-xs text-slate-400 light:text-slate-600 line-clamp-2 mt-2.5 mb-5 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>

        {project.techStack.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            {project.techStack.slice(0, 5).map((tech, tIdx) => {
              const colors = [
                'bg-brand-500/10 text-brand-400 border-brand-500/15 light:bg-brand-500/15 light:text-brand-600 light:border-brand-500/20',
                'bg-sky-500/10 text-sky-400 border-sky-500/15 light:bg-sky-500/15 light:text-sky-600 light:border-sky-500/20',
                'bg-violet-500/10 text-violet-400 border-violet-500/15 light:bg-violet-500/15 light:text-violet-600 light:border-violet-500/20',
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/15 light:bg-emerald-500/15 light:text-emerald-700 light:border-emerald-500/20',
                'bg-amber-500/10 text-amber-400 border-amber-500/15 light:bg-amber-500/15 light:text-amber-600 light:border-amber-500/20'
              ];
              const colorClass = colors[tIdx % colors.length];
              return (
                <span key={tech} className={`px-2 py-0.5 text-[9px] font-medium border rounded-md ${colorClass}`}>
                  {tech}
                </span>
              );
            })}
            {project.techStack.length > 5 && (
              <span className="text-[9px] text-slate-500 font-medium">+{project.techStack.length - 5}</span>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/5 light:border-slate-200/80 pt-4 flex flex-col gap-3">
        <div>
          <div className="flex justify-between items-center text-[10px] font-medium text-slate-400 light:text-slate-500 mb-1">
            <span>Completion Progress</span>
            <span className="text-white light:text-slate-900 font-semibold">{project.completionPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800/80 light:bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${project.completionPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 light:text-slate-600 font-medium mt-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>
              {project.totalLoggedHours || 0}h
              {project.totalEstimatedHours ? ` / ${project.totalEstimatedHours}h` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex -space-x-2 overflow-hidden">
              {(project.members || []).slice(0, 3).map((member, mIdx) => (
                <div
                  key={member.userId || mIdx}
                  className="inline-block h-5 w-5 rounded-full border border-slate-900 light:border-white bg-slate-800 light:bg-slate-100 text-[9px] text-slate-300 light:text-slate-700 font-bold flex items-center justify-center"
                  title={member.displayName}
                >
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
              ))}
              {project.members && project.members.length > 3 && (
                <div className="inline-block h-5 w-5 rounded-full border border-slate-900 light:border-white bg-slate-800 light:bg-slate-100 text-[8px] text-brand-400 light:text-brand-600 font-bold flex items-center justify-center">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
            <Users className="h-3 w-3 text-slate-500 ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
