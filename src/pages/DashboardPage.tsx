import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Users,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { projectsApi } from '../api/projects';
import type { ProjectResponse } from '../api/projects';
import { mapServerErrorToEnglish } from '../api/errors';
import logo from '../assets/logo.png';
import { SafariTopBar } from '../components/SafariTopBar';
import { SafariBottomBar } from '../components/SafariBottomBar';
import UserProfileDrawer from '../components/UserProfileDrawer';

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(9);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'PENDING_AI'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [localSearchResults, setLocalSearchResults] = useState<ProjectResponse[] | null>(null);
  const [localTotalElements, setLocalTotalElements] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
  const [shakeToggle, setShakeToggle] = useState(false);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 400);
  };


  const [form, setForm] = useState<{
    name: string;
    description: string;
    techStack: string[];
  }>({
    name: '',
    description: '',
    techStack: []
  });
  const [currentTechInput, setCurrentTechInput] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProjects = React.useCallback(async (page: number, size: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof projectsApi.listProjects>[0] = { page, size };

      if (status !== 'ALL') {
        params.status = status as typeof params.status;
      }

      const response = await projectsApi.listProjects(params);
      setProjects(response.content || []);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      setError(parsed.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllForSearch = React.useCallback(async (status: string, query: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof projectsApi.listProjects>[0] = { page: 0, size: 100 };
      if (status !== 'ALL') {
        params.status = status as typeof params.status;
      }
      const response = await projectsApi.listProjects(params);
      const all = response.content || [];

      const q = query.toLowerCase().trim();
      const filtered = all.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.techStack.some(t => t.toLowerCase().includes(q))
      );

      setLocalSearchResults(filtered);
      setLocalTotalElements(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setCurrentPage(0);
      setProjects(filtered.slice(0, pageSize));
      setTotalElements(filtered.length);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      setError(parsed.message);
      setProjects([]);
      setLocalSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSearchResults(null);
      fetchProjects(currentPage, pageSize, activeFilter);
    }
  }, [currentPage, pageSize, activeFilter, searchQuery, fetchProjects]);

  useEffect(() => {
    if (searchQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAllForSearch(activeFilter, searchQuery);
    }
  }, [searchQuery, activeFilter, fetchAllForSearch]);

  useEffect(() => {
    if (localSearchResults && searchQuery.trim()) {
      const start = currentPage * pageSize;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProjects(localSearchResults.slice(start, start + pageSize));
      setTotalElements(localTotalElements);
    }
  }, [currentPage, pageSize, localSearchResults, localTotalElements, searchQuery]);

  const handleFilterChange = (filter: typeof activeFilter) => {
    setActiveFilter(filter);
    setCurrentPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setCurrentPage(0);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const addTag = (tagText: string) => {
    const clean = tagText.replace(/,/g, '').trim();
    if (clean && !form.techStack.includes(clean)) {
      setForm(prev => ({
        ...prev,
        techStack: [...prev.techStack, clean]
      }));
    }
    setCurrentTechInput('');
  };

  const removeTag = (indexToRemove: number) => {
    setForm(prev => ({
      ...prev,
      techStack: prev.techStack.filter((_, idx) => idx !== indexToRemove)
    }));
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
      const finalTechStack = [...form.techStack];
      const trimmedInput = currentTechInput.trim();
      if (trimmedInput && !finalTechStack.includes(trimmedInput)) {
        finalTechStack.push(trimmedInput);
      }

      await projectsApi.createProject({
        name: form.name.trim(),
        description: form.description.trim(),
        techStack: finalTechStack,
        teamSize: 1,
        aiEstimate: true
      });

      setForm({
        name: '',
        description: '',
        techStack: []
      });
      setCurrentTechInput('');
      closeModal();
      fetchProjects(0, pageSize, activeFilter);
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
    total: totalElements,
    active: projects.filter(p => p.status === 'ACTIVE' || p.status === 'PENDING_AI').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    hours: projects.reduce((sum, p) => sum + (p.totalLoggedHours || 0), 0)
  };

  return (
    <div className="relative min-h-screen bg-slate-950 light:bg-[#f1f5f9] text-slate-100 light:text-slate-900 flex flex-col font-sans transition-colors duration-300">

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 animate-slow-fade hidden md:block">
        <div className="absolute inset-[-30%] w-[160%] h-[160%] animate-[spin_200s_linear_infinite] opacity-[0.85] mix-blend-normal">
          <div className="absolute top-[20%] left-[15%] w-[55vw] h-[55vw] min-w-[650px] min-h-[650px] bg-indigo-600/10 light:bg-indigo-500/5 blur-[180px] animate-blob-one" />
          <div className="absolute top-[15%] right-[15%] w-[65vw] h-[65vw] min-w-[750px] min-h-[750px] bg-purple-600/8 light:bg-purple-500/4 blur-[200px] animate-blob-two" />
          <div className="absolute bottom-[20%] left-[20%] w-[55vw] h-[55vw] min-w-[650px] min-h-[650px] bg-blue-600/8 light:bg-blue-500/4 blur-[180px] animate-blob-three" />
          <div className="absolute bottom-[15%] right-[15%] w-[60vw] h-[60vw] min-w-[700px] min-h-[700px] bg-amber-500/5 light:bg-amber-400/3 blur-[190px] animate-blob-four" />
        </div>
      </div>

      <svg className="fixed inset-0 w-full h-full opacity-[0.05] light:opacity-[0.02] pointer-events-none z-1 mix-blend-overlay animate-slow-fade hidden md:block">
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

      <div className={`absolute inset-0 transition-colors duration-300 z-0 pointer-events-none md:hidden ${theme === 'light' ? 'light-dashboard-bg-mobile' : 'dashboard-bg-mobile'
        }`} />

      <div className="md:hidden fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-950 light:from-[#f1f5f9] to-transparent pointer-events-none z-30 md:animate-slow-fade" />
      <div className="md:hidden absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 light:from-[#f1f5f9] to-transparent pointer-events-none z-30 md:animate-slow-fade" />

      <div className="sticky top-0 z-40 w-full h-[88px] sm:h-24 pointer-events-none">
        <header className={`w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${isScrolled ? 'py-1.5 sm:py-2' : 'py-3 sm:py-4'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] px-4 sm:px-6 h-16 flex items-center justify-between animate-header-fade-in ${isScrolled
              ? 'bg-[#020617]/70 light:bg-white/70 border border-brand-500/20 light:border-brand-500/20 rounded-xl shadow-lg shadow-brand-500/5'
              : 'bg-[#020617]/70 light:bg-white/75 border border-white/10 light:border-slate-200/60 rounded-2xl shadow-lg shadow-black/10 light:shadow-slate-200/10'
              }`}>
              <Link to="/" className="flex items-center gap-3 group/logo cursor-pointer focus:outline-none">
                <div className="relative flex items-center justify-center transition-transform duration-300 group-hover/logo:scale-105">
                  <div className="absolute inset-0 bg-brand-500/20 blur-md rounded-full group-hover/logo:bg-brand-500/35 transition-all"></div>
                  <img src={logo} alt="TaskGraph Logo" className="h-9 w-auto relative z-10" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-brand-400 light:from-brand-500 to-amber-500 light:to-amber-600 bg-clip-text text-transparent tracking-tight transition-all duration-300 group-hover/logo:opacity-90">
                  TaskGraph
                </span>
              </Link>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2.5 hover:opacity-80 active:scale-95 transition-all cursor-pointer group/avatar"
                  aria-label="Open profile"
                >
                  <div className="h-8 w-8 rounded-full border border-brand-500/30 light:border-brand-500/40 bg-brand-500/10 light:bg-brand-500/15 text-brand-400 light:text-brand-600 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                    ) : (
                      user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-slate-300 light:text-slate-700 group-hover/avatar:text-brand-400 transition-colors">
                    {user?.displayName || 'User'}
                  </span>
                </button>

                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center p-2 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 hover:text-white text-slate-400 transition-colors duration-300 active:scale-95 cursor-pointer light:border-slate-200 light:hover:bg-slate-100 light:hover:text-slate-900 light:text-slate-600 group"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? (
                    <Moon className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                  ) : (
                    <Sun className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110" />
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 hover:text-white text-slate-400 transition-all text-xs font-medium cursor-pointer light:border-slate-200 light:hover:bg-slate-100 light:hover:text-slate-900 light:text-slate-600"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        <div className="flex flex-col gap-6 animate-slide-down-fade">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-slate-900">
              Welcome back, <span className="text-brand-400 light:text-brand-600">{user?.displayName || 'Developer'}</span>!
            </h1>
            <p className="text-sm text-slate-400 light:text-slate-600 mt-1">
              Here is an overview of your projects and development progress.
            </p>
          </div>

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
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center border-b border-white/5 light:border-slate-200/80 pb-5 animate-slide-down-fade [animation-delay:100ms]">

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
                onClick={() => handleFilterChange(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all duration-300 active:scale-97 cursor-pointer will-change-transform ${activeFilter === tab.id
                  ? 'bg-gradient-to-r from-brand-500/20 to-orange-500/20 text-brand-400 border-brand-500/40 shadow-inner light:from-brand-500/10 light:to-orange-500/10 light:text-brand-600 light:border-brand-500/40'
                  : 'bg-slate-900/40 text-slate-400 border-white/5 hover:bg-slate-800/40 hover:text-slate-200 hover:border-slate-700 light:bg-white/60 light:text-slate-600 light:border-slate-200/60 light:hover:bg-slate-100 light:hover:text-slate-900'
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
                value={searchInput}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full bg-slate-900/40 light:bg-white border border-white/10 light:border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-2.5 hover:text-white light:hover:text-slate-900 text-slate-500 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative h-10 px-4 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all duration-300 cursor-pointer overflow-hidden shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-orange-600 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Plus className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              <span className="relative z-10">New Project</span>
            </button>
          </div>

        </div>

        <div className="flex-1 animate-slide-up-fade [animation-delay:200ms]">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
              <span className="text-slate-400 light:text-slate-600 text-sm font-medium animate-pulse">Loading projects...</span>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-md mx-auto my-12">
              <h3 className="text-red-400 font-bold text-lg">Error loading projects</h3>
              <p className="text-slate-400 text-sm mt-2">{error}</p>
              <button
                onClick={() => fetchProjects(currentPage, pageSize, activeFilter)}
                className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 light:bg-white/40 border border-dashed border-white/5 light:border-slate-200 rounded-2xl p-8 max-w-lg mx-auto">
              <div className="h-14 w-14 rounded-2xl bg-slate-900/60 light:bg-white/80 border border-white/5 light:border-slate-200 text-slate-500 light:text-slate-400 flex items-center justify-center mb-5">
                <FolderOpen className="h-7 w-7" />
              </div>
              <h3 className="text-white light:text-slate-900 font-bold text-lg">No projects found</h3>
              <p className="text-slate-400 light:text-slate-600 text-sm mt-1 max-w-sm">
                {searchInput || activeFilter !== 'ALL'
                  ? "No projects match your search query or filters. Try adjusting them."
                  : "You haven't created any projects yet. Start by creating a new one!"}
              </p>
              {!searchInput && activeFilter === 'ALL' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 light:bg-white light:hover:bg-slate-50 text-slate-200 light:text-slate-700 border border-white/10 light:border-slate-200 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Create First Project
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                key={`${activeFilter}-${searchQuery}-${pageSize}-${currentPage}`}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {projects.map((project, idx) => (

                  <div
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="group relative cursor-pointer bg-slate-900/40 light:bg-white/60 backdrop-blur-2xl border border-white/10 light:border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-black/20 light:shadow-slate-200/20 hover:border-brand-500/30 light:hover:border-brand-500/40 transition-all duration-300 hover:-translate-y-1 animate-slide-up-fade"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >

                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500/0 via-brand-500/3 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="text-base font-bold text-slate-100 light:text-slate-900 group-hover:text-brand-400 light:group-hover:text-brand-600 transition-colors tracking-tight line-clamp-1">
                          {project.name}
                        </h3>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border shrink-0 ${project.status === 'ACTIVE'
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
                ))}
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-5 pt-6 pb-4 animate-slide-up-fade">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400 light:text-slate-500 text-center">
                  <span>
                    Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} projects
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                    <span className="text-slate-500 hidden sm:inline">per page:</span>
                    {[9, 18, 36].map(n => (
                      <button
                        key={n}
                        onClick={() => handlePageSizeChange(n)}
                        className={`px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-md border transition-all cursor-pointer ${pageSize === n
                          ? 'bg-brand-500/15 text-brand-400 border-brand-500/30 light:bg-brand-500/10 light:text-brand-600 light:border-brand-500/30'
                          : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:bg-slate-700/40 hover:text-slate-200 light:bg-slate-100 light:text-slate-500 light:border-slate-200 light:hover:bg-slate-200'
                          }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-1.5 w-full lg:w-auto">
                  <button
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                    className="hidden sm:block px-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-700/40 bg-slate-900/40 light:bg-white/60 light:border-slate-200 text-slate-400 light:text-slate-500 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800/50 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900 transition-all cursor-pointer"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg border border-slate-700/40 bg-slate-900/40 light:bg-white/60 light:border-slate-200 text-slate-400 light:text-slate-500 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800/50 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900 transition-all cursor-pointer"
                  >
                    Prev
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {(() => {
                      const pages: (number | 'ellipsis')[] = [];
                      const maxVisible = 5;
                      if (totalPages <= maxVisible) {
                        for (let i = 0; i < totalPages; i++) pages.push(i);
                      } else {
                        pages.push(0);
                        if (currentPage > 2) pages.push('ellipsis');
                        const start = Math.max(1, currentPage - 1);
                        const end = Math.min(totalPages - 2, currentPage + 1);
                        for (let i = start; i <= end; i++) pages.push(i);
                        if (currentPage < totalPages - 3) pages.push('ellipsis');
                        pages.push(totalPages - 1);
                      }
                      return pages.map((p, i) =>
                        p === 'ellipsis' ? (
                          <span key={`ellipsis-${i}`} className="px-1 sm:px-1.5 text-[11px] sm:text-xs text-slate-500">...</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-1.5 sm:px-2 text-[11px] sm:text-xs font-semibold rounded-lg border transition-all cursor-pointer ${currentPage === p
                              ? 'bg-brand-500/20 text-brand-400 border-brand-500/40 light:bg-brand-500/10 light:text-brand-600 light:border-brand-500/30'
                              : 'border-slate-700/40 bg-slate-900/40 light:bg-white/60 light:border-slate-200 text-slate-400 light:text-slate-500 hover:bg-slate-800/50 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900'
                              }`}
                          >
                            {p + 1}
                          </button>
                        )
                      );
                    })()}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg border border-slate-700/40 bg-slate-900/40 light:bg-white/60 light:border-slate-200 text-slate-400 light:text-slate-500 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800/50 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="hidden sm:block px-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-700/40 bg-slate-900/40 light:bg-white/60 light:border-slate-200 text-slate-400 light:text-slate-500 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800/50 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900 transition-all cursor-pointer"
                  >
                    Last
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      <footer className="relative z-40 py-8 mt-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-medium">
          TaskGraph — Semantical Task Tracker. All rights reserved.
        </div>
      </footer>

      {isModalOpen && (
        <>
          <div className="md:hidden">
            <SafariTopBar colorClass="light:bg-black/60" zIndexClass="z-[10000]" />
            <SafariBottomBar colorClass="light:bg-[#59585E]" zIndexClass="z-[10000]" />
          </div>

          <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-950 light:from-[#616264] to-transparent pointer-events-none z-60" />
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 light:from-[#59585E] to-transparent pointer-events-none z-60" />

          <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-200 
            ${isClosing ? 'modal-overlay-exit' : 'animate-fade-in'}`}>
            <div
              className={`bg-slate-900/90 light:bg-white/95 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-lg p-6 
                ${isClosing ? 'modal-content-exit' : 'animate-zoom-in-fade'}
                ${shakeToggle && !fieldErrors.name && !fieldErrors.description ? 'animate-shake' : ''}`}
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

                <div className={`flex flex-col gap-1.5 transition-all ${fieldErrors.name ? (shakeToggle ? 'animate-shake' : 'animate-shake-alt') : ''
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
                    onChange={e => {
                      setForm(p => ({ ...p, name: e.target.value }));
                      setFieldErrors(prev => ({ ...prev, name: undefined }));
                      setFormError(null);
                    }}
                    className={`w-full bg-slate-950 light:bg-slate-50 light:focus:bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:outline-none transition-all duration-300 focus:ring-1 ${fieldErrors.name
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500 light:border-slate-200 light:focus:border-brand-500 light:focus:ring-brand-500'
                      }`}
                  />
                </div>

                <div className={`flex flex-col gap-1.5 transition-all ${fieldErrors.description ? (shakeToggle ? 'animate-shake' : 'animate-shake-alt') : ''
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
                    onChange={e => {
                      setForm(p => ({ ...p, description: e.target.value }));
                      setFieldErrors(prev => ({ ...prev, description: undefined }));
                      setFormError(null);
                    }}
                    className={`w-full bg-slate-950 light:bg-slate-50 light:focus:bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:outline-none transition-all duration-300 resize-none focus:ring-1 ${fieldErrors.description
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
      )}

      <UserProfileDrawer
        key={isProfileOpen ? `open-${user?.displayName}-${user?.avatarUrl}` : 'closed'}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
