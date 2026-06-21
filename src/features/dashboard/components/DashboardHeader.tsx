import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import logo from '../../../assets/logo.png';

interface DashboardHeaderProps {
  user: {
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  setIsProfileOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export function DashboardHeader({
  user,
  theme,
  toggleTheme,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  setIsProfileOpen,
  handleLogout
}: DashboardHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="sticky top-0 z-40 w-full h-[88px] sm:h-24 pointer-events-none">
      <header className={`w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${
        isScrolled ? 'py-1.5 sm:py-2' : 'py-3 sm:py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className={`backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between animate-header-fade-in relative z-50 ${
            isScrolled
              ? 'bg-[#020617]/70 light:bg-white/70 border border-brand-500/20 light:border-brand-500/20 rounded-xl shadow-lg shadow-brand-500/5'
              : 'bg-[#020617]/70 light:bg-white/75 border border-white/10 light:border-slate-200/60 rounded-2xl shadow-lg shadow-black/10 light:shadow-slate-200/10'
          }`}>

            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group/logo cursor-pointer focus:outline-none shrink-0">
              <div className="relative flex items-center justify-center transition-transform duration-300 group-hover/logo:scale-105 shrink-0">
                <div className="absolute inset-0 bg-brand-500/20 blur-md rounded-full group-hover/logo:bg-brand-500/35 transition-all"></div>
                <img src={logo} alt="TaskGraph Logo" className="h-7 sm:h-9 w-auto relative z-10" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-brand-400 light:from-brand-500 to-amber-500 light:to-amber-600 bg-clip-text text-transparent tracking-tight transition-all duration-300 group-hover/logo:opacity-90 truncate">
                TaskGraph
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-4 shrink-0">
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
                <span className="text-sm font-medium text-slate-300 light:text-slate-700 group-hover/avatar:text-brand-400 transition-colors">
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
                <span>Log Out</span>
              </button>
            </div>

            <div className="flex sm:hidden items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-xl transition-colors duration-300 cursor-pointer overflow-hidden ${
                  isMobileMenuOpen
                    ? 'bg-brand-500/10 text-brand-400 light:bg-brand-500/15 light:text-brand-600'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white light:text-slate-500 light:hover:bg-slate-100 light:hover:text-slate-900'
                }`}
                aria-label="Toggle mobile menu"
              >
                <div className="relative h-5 w-5 flex items-center justify-center">
                  <Menu
                    className={`absolute transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isMobileMenuOpen ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'
                    }`}
                  />
                  <X
                    className={`absolute transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isMobileMenuOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          <div
            className={`absolute top-[calc(100%+0.5rem)] left-4 right-4 sm:hidden z-40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu bg-[#020617]/80 light:bg-white/80 backdrop-blur-xl border border-white/10 light:border-slate-200/60 rounded-2xl shadow-xl shadow-black/20 light:shadow-slate-200/40 p-2 flex flex-col gap-1 ${
              isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            <button
              onClick={() => {
                setIsProfileOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 light:hover:bg-slate-100/50 transition-colors text-left w-full cursor-pointer"
            >
              <div className="h-9 w-9 rounded-full border border-brand-500/30 light:border-brand-500/40 bg-brand-500/10 light:bg-brand-500/15 text-brand-400 light:text-brand-600 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                ) : (
                  user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-semibold text-slate-100 light:text-slate-800 truncate">
                  {user?.displayName || 'User'}
                </span>
                <span className="text-xs text-brand-400 light:text-brand-600 font-medium">
                  View Profile
                </span>
              </div>
            </button>

            <div className="h-px bg-white/5 light:bg-slate-200/80 my-1 mx-2" />

            <button
              onClick={() => {
                toggleTheme();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 light:hover:bg-slate-100/50 transition-colors text-slate-300 light:text-slate-600 font-medium text-sm w-full cursor-pointer"
            >
              <div className="h-8 w-8 rounded-lg bg-slate-900/50 light:bg-slate-100 flex items-center justify-center border border-white/5 light:border-slate-200/50">
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</span>
            </button>

            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 light:text-red-500 font-medium text-sm w-full cursor-pointer group"
            >
              <div className="h-8 w-8 rounded-lg bg-red-500/10 light:bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
                <LogOut className="h-4 w-4" />
              </div>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
