import { useNavigate } from 'react-router-dom';
import { Loader2, Search, X, Plus, FolderOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useDashboard } from '../features/dashboard/hooks/useDashboard';
import { DashboardHeader } from '../features/dashboard/components/DashboardHeader';
import { DashboardStats } from '../features/dashboard/components/DashboardStats';
import { ProjectCard } from '../features/dashboard/components/ProjectCard';
import { ProjectCreatorModal } from '../features/dashboard/components/ProjectCreatorModal';
import UserProfileOverlay from '../components/common/UserProfileOverlay';

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const {
    user,
    projects,
    loading,
    error,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    activeFilter,
    searchInput,
    searchQuery,
    isModalOpen,
    isClosing,
    isProfileOpen,
    isMobileMenuOpen,
    submitting,
    formError,
    fieldErrors,
    shakeToggle,
    form,
    currentTechInput,
    stats,
    setIsProfileOpen,
    setIsMobileMenuOpen,
    setForm,
    setCurrentTechInput,
    setCurrentPage,
    closeModal,
    openModal,
    handleFilterChange,
    handleSearchChange,
    handlePageSizeChange,
    handleLogout,
    addTag,
    removeTag,
    handleCreateProject,
    fetchProjects,
    handleNameChange,
    handleDescriptionChange
  } = useDashboard();

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

      <DashboardHeader
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setIsProfileOpen={setIsProfileOpen}
        handleLogout={handleLogout}
      />

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

          <DashboardStats stats={stats} />
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
              onClick={openModal}
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
                  onClick={openModal}
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
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    idx={idx}
                  />
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
        <ProjectCreatorModal
          isClosing={isClosing}
          closeModal={closeModal}
          formError={formError}
          fieldErrors={fieldErrors}
          shakeToggle={shakeToggle}
          form={form}
          currentTechInput={currentTechInput}
          submitting={submitting}
          handleNameChange={handleNameChange}
          handleDescriptionChange={handleDescriptionChange}
          setCurrentTechInput={setCurrentTechInput}
          addTag={addTag}
          removeTag={removeTag}
          setForm={setForm}
          handleCreateProject={handleCreateProject}
        />
      )}

      <UserProfileOverlay
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
