import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  Plus,
  LogOut,
  Clock,
  Search,
  FolderOpen,
  Loader2,
  X,
  CheckCircle2,
  Activity,
  BookOpen,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { projectsApi } from '../api/projects';
import type { ProjectResponse } from '../api/projects';
import { mapServerErrorToEnglish } from '../api/errors';
import logo from '../assets/logo.png';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [allProjects, setAllProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'PENDING_AI'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
  const [shakeToggle, setShakeToggle] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    backendTech: '',
    frontendTech: '',
    otherTech: ''
  });

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsApi.listProjects({ page: 0, size: 100 });
      setAllProjects(response.content || []);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, status);
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await projectsApi.listProjects({ page: 0, size: 100 });
        if (active) {
          setAllProjects(response.content || []);
        }
      } catch (err) {
        if (active) {
          const status = axios.isAxiosError(err) ? err.response?.status : undefined;
          const parsed = mapServerErrorToEnglish(err, status);
          setError(parsed.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredProjects = allProjects.filter(p => {
    if (activeFilter !== 'ALL' && p.status !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.techStack.backend.some(t => t.toLowerCase().includes(query)) ||
        p.techStack.frontend.some(t => t.toLowerCase().includes(query)) ||
        p.techStack.other.some(t => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors: { name?: string; description?: string } = {};
    if (!form.name.trim()) {
      errors.name = 'Project name is required.';
    }
    if (!form.description.trim()) {
      errors.description = 'Description is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShakeToggle(prev => !prev);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const techStack = {
        backend: form.backendTech ? form.backendTech.split(',').map(t => t.trim()).filter(Boolean) : [],
        frontend: form.frontendTech ? form.frontendTech.split(',').map(t => t.trim()).filter(Boolean) : [],
        other: form.otherTech ? form.otherTech.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      await projectsApi.createProject({
        name: form.name.trim(),
        description: form.description.trim(),
        techStack,
        teamSize: 1,
        aiEstimate: true
      });

      setForm({
        name: '',
        description: '',
        backendTech: '',
        frontendTech: '',
        otherTech: ''
      });
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, status);
      setFormError(parsed.message);
      setShakeToggle(prev => !prev);
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: allProjects.length,
    active: allProjects.filter(p => p.status === 'ACTIVE' || p.status === 'PENDING_AI').length,
    completed: allProjects.filter(p => p.status === 'COMPLETED').length,
    hours: allProjects.reduce((sum, p) => sum + (p.totalLoggedHours || 0), 0)
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 animate-slow-fade hidden md:block">
        <div className="absolute inset-[-30%] w-[160%] h-[160%] animate-[spin_200s_linear_infinite] opacity-[0.85] mix-blend-normal">
          <div className="absolute top-[20%] left-[15%] w-[55vw] h-[55vw] min-w-[650px] min-h-[650px] bg-indigo-950/40 blur-[200px] animate-blob-one" />
          <div className="absolute top-[15%] right-[15%] w-[65vw] h-[65vw] min-w-[750px] min-h-[750px] bg-purple-950/30 blur-[220px] animate-blob-two" />
          <div className="absolute bottom-[20%] left-[20%] w-[55vw] h-[55vw] min-w-[650px] min-h-[650px] bg-slate-900/35 blur-[200px] animate-blob-three" />
          <div className="absolute bottom-[15%] right-[15%] w-[60vw] h-[60vw] min-w-[700px] min-h-[700px] bg-amber-950/15 blur-[210px] animate-blob-four" />
        </div>
      </div>

      <svg className="fixed inset-0 w-full h-full opacity-[0.05] pointer-events-none z-1 mix-blend-overlay animate-slow-fade hidden md:block">
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      <div className="fixed inset-0 bg-gradient-mobile md:hidden z-0 pointer-events-none" />

      <div className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-10 animate-slow-fade" />
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10 animate-slow-fade" />

      <header className="relative z-40 border-b border-white/10 bg-slate-900/40 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-brand-500/20 blur-md rounded-full"></div>
              <img src={logo} alt="TaskGraph Logo" className="h-9 w-auto relative z-10" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-amber-500 bg-clip-text text-transparent tracking-tight">
              TaskGraph
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-sm">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium text-slate-300">
                {user?.displayName || 'User'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 hover:text-white transition-all text-xs font-medium text-slate-400 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        <div className="flex flex-col gap-6 animate-slide-down-fade">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, <span className="text-brand-400">{user?.displayName || 'Developer'}</span>!
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Here is an overview of your projects and development progress.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-black/10 hover:border-brand-500/20 transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Projects</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{stats.total}</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <Folder className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-black/10 hover:border-brand-500/20 transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{stats.active}</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-black/10 hover:border-brand-500/20 transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{stats.completed}</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-black/10 hover:border-brand-500/20 transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Time Logged</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{stats.hours.toFixed(1)}h</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>

          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center border-b border-white/5 pb-5 animate-slide-down-fade [animation-delay:100ms]">

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'ALL', label: 'All Projects' },
                { id: 'ACTIVE', label: 'Active' },
                { id: 'PENDING_AI', label: 'Pending AI' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'ARCHIVED', label: 'Archived' }
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer ${activeFilter === tab.id
                  ? 'bg-gradient-to-r from-brand-500/20 to-orange-500/20 text-brand-400 border-brand-500/40 shadow-inner'
                  : 'bg-slate-900/40 text-slate-400 border-white/5 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 hover:text-white text-slate-500 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-orange-600 hover:from-brand-500 hover:to-orange-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-98 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
          </div>

        </div>

        <div className="flex-1 animate-slide-up-fade [animation-delay:200ms]">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
              <span className="text-slate-400 text-sm font-medium animate-pulse">Loading projects...</span>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-md mx-auto my-12">
              <h3 className="text-red-400 font-bold text-lg">Error loading projects</h3>
              <p className="text-slate-400 text-sm mt-2">{error}</p>
              <button
                onClick={fetchProjects}
                className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-white/5 rounded-2xl p-8 max-w-lg mx-auto">
              <div className="h-14 w-14 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-500 flex items-center justify-center mb-5">
                <FolderOpen className="h-7 w-7" />
              </div>
              <h3 className="text-white font-bold text-lg">No projects found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">
                {searchQuery || activeFilter !== 'ALL'
                  ? "No projects match your search query or filters. Try adjusting them."
                  : "You haven't created any projects yet. Start by creating a new one!"}
              </p>
              {!searchQuery && activeFilter === 'ALL' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Create First Project
                </button>
              )}
            </div>
          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, idx) => (

                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="group relative cursor-pointer bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-black/20 hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >

                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500/0 via-brand-500/3 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-brand-400 transition-colors tracking-tight line-clamp-1">
                        {project.name}
                      </h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border shrink-0 ${project.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : project.status === 'COMPLETED'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : project.status === 'ARCHIVED'
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-2.5 mb-5 leading-relaxed">
                      {project.description || 'No description provided.'}
                    </p>

                    <div className="flex flex-col gap-2.5 mb-6">

                      {project.techStack.backend.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-semibold mr-1">BE:</span>
                          {project.techStack.backend.slice(0, 3).map(tech => (
                            <span key={tech} className="px-2 py-0.5 text-[9px] font-medium bg-brand-500/10 text-brand-400 border border-brand-500/15 rounded-md">
                              {tech}
                            </span>
                          ))}
                          {project.techStack.backend.length > 3 && (
                            <span className="text-[9px] text-slate-500 font-medium">+{project.techStack.backend.length - 3}</span>
                          )}
                        </div>
                      )}

                      {project.techStack.frontend.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-semibold mr-1">FE:</span>
                          {project.techStack.frontend.slice(0, 3).map(tech => (
                            <span key={tech} className="px-2 py-0.5 text-[9px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/15 rounded-md">
                              {tech}
                            </span>
                          ))}
                          {project.techStack.frontend.length > 3 && (
                            <span className="text-[9px] text-slate-500 font-medium">+{project.techStack.frontend.length - 3}</span>
                          )}
                        </div>
                      )}

                      {project.techStack.other.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-semibold mr-1">Tools:</span>
                          {project.techStack.other.slice(0, 3).map(tech => (
                            <span key={tech} className="px-2 py-0.5 text-[9px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/15 rounded-md">
                              {tech}
                            </span>
                          ))}
                          {project.techStack.other.length > 3 && (
                            <span className="text-[9px] text-slate-500 font-medium">+{project.techStack.other.length - 3}</span>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 flex flex-col gap-3">

                    <div>
                      <div className="flex justify-between items-center text-[10px] font-medium text-slate-400 mb-1">
                        <span>Completion Progress</span>
                        <span className="text-white font-semibold">{project.completionPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${project.completionPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-1">

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
                              className="inline-block h-5 w-5 rounded-full border border-slate-900 bg-slate-800 text-[9px] text-slate-300 font-bold flex items-center justify-center"
                              title={member.displayName}
                            >
                              {member.displayName.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {project.members && project.members.length > 3 && (
                            <div className="inline-block h-5 w-5 rounded-full border border-slate-900 bg-slate-800 text-[8px] text-brand-400 font-bold flex items-center justify-center">
                              +{project.members.length - 3}
                            </div>
                          )}
                        </div>
                        <Users className="h-3 w-3 text-slate-500 ml-1" />
                      </div>

                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <footer className="relative z-20 border-t border-white/5 py-6 mt-16 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-medium">
          TaskGraph — Semantical Task Tracker. All rights reserved.
        </div>
      </footer>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">

          <div
            className={`bg-slate-900/90 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden animate-zoom-in-fade ${shakeToggle ? 'animate-shake' : 'animate-shake-alt'
              }`}
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-brand-500" />
                <h3 className="text-lg font-bold text-white tracking-tight">Create New Project</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-6 w-6 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="proj-name" className="text-xs font-semibold text-slate-400">
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
                  onChange={e => {
                    setForm(p => ({ ...p, name: e.target.value }));
                    setFieldErrors(prev => ({ ...prev, name: undefined }));
                    setFormError(null);
                  }}
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all ${fieldErrors.name
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-brand-500'
                    }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="proj-desc" className="text-xs font-semibold text-slate-400">
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
                  onChange={e => {
                    setForm(p => ({ ...p, description: e.target.value }));
                    setFieldErrors(prev => ({ ...prev, description: undefined }));
                    setFormError(null);
                  }}
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all resize-none ${fieldErrors.description
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-brand-500'
                    }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="proj-be" className="text-xs font-semibold text-slate-400">
                  Backend Tech Stack
                </label>
                <input
                  id="proj-be"
                  type="text"
                  placeholder="e.g. Java, Spring Boot, PostgreSQL (comma-separated)"
                  value={form.backendTech}
                  onChange={e => setForm(p => ({ ...p, backendTech: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="proj-fe" className="text-xs font-semibold text-slate-400">
                  Frontend Tech Stack
                </label>
                <input
                  id="proj-fe"
                  type="text"
                  placeholder="e.g. React, TypeScript, Tailwind CSS (comma-separated)"
                  value={form.frontendTech}
                  onChange={e => setForm(p => ({ ...p, frontendTech: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="proj-other" className="text-xs font-semibold text-slate-400">
                  Databases & Other Tools
                </label>
                <input
                  id="proj-other"
                  type="text"
                  placeholder="e.g. Docker, Redis, Nginx, Git (comma-separated)"
                  value={form.otherTech}
                  onChange={e => setForm(p => ({ ...p, otherTech: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-600 to-orange-600 hover:from-brand-500 hover:to-orange-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-98 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Create Project</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

    </div>
  );
}
