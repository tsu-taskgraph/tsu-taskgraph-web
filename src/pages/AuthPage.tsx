import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, ArrowRight, ShieldAlert, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import logo from '../assets/logo.png';
import { mapServerErrorToEnglish } from '../api/errors';

export default function AuthPage() {
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    displayName?: string;
  }>({});
  const [shakeToggle, setShakeToggle] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setFieldErrors(prev => ({ ...prev, email: undefined }));
    setError(null);

    if (!val.trim()) {
      setEmailSuggestions([]);
      return;
    }

    const popularDomains = ['gmail.com', 'yandex.ru', 'mail.ru', 'outlook.com'];

    if (!val.includes('@')) {
      setEmailSuggestions(popularDomains.map(d => `${val}@${d}`));
    } else {
      const [localPart, domainPart] = val.split('@');
      if (domainPart === undefined) {
        setEmailSuggestions(popularDomains.map(d => `${val}@${d}`));
      } else if (domainPart === '') {
        setEmailSuggestions(popularDomains.map(d => `${localPart}@${d}`));
      } else {
        const filtered = popularDomains.filter(d => d.startsWith(domainPart));
        setEmailSuggestions(filtered.map(d => `${localPart}@${d}`));
      }
    }
  };

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { email?: string; password?: string; displayName?: string } = {};

    const trimmedEmail = email.trim();
    if (trimmedEmail.length < 1) {
      errors.email = 'Email is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (isLogin) {
      if (password.length < 1) {
        errors.password = 'Password is required.';
      }
    } else {
      if (displayName.trim().length < 1) {
        errors.displayName = 'Username is required.';
      }
      if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters long.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShakeToggle(prev => !prev);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, displayName });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiData = err.response?.data;
        const apiMessage = apiData?.message || '';

        const mapped = mapServerErrorToEnglish(apiData || apiMessage, status, { isLogin });

        if (mapped.fieldErrors && Object.keys(mapped.fieldErrors).length > 0) {
          const formErrors: typeof fieldErrors = {};
          if (mapped.fieldErrors.email) formErrors.email = mapped.fieldErrors.email;
          if (mapped.fieldErrors.password) formErrors.password = mapped.fieldErrors.password;
          if (mapped.fieldErrors.displayName) formErrors.displayName = mapped.fieldErrors.displayName;

          if (Object.keys(formErrors).length > 0) {
            setFieldErrors(formErrors);
          } else {
            setError(mapped.message);
            setShakeToggle(prev => !prev);
          }
        } else if (mapped.field === 'email' || mapped.field === 'password' || mapped.field === 'displayName') {
          setFieldErrors({ [mapped.field]: mapped.message });
        } else {
          setError(mapped.message);
          setShakeToggle(prev => !prev);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
        setShakeToggle(prev => !prev);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-dvh flex items-center justify-center py-8 px-4 transition-colors duration-300 ${theme === 'light' ? 'light-gradient-mobile md:bg-[#f1f5f9]' : 'bg-gradient-mobile md:bg-slate-950'
      }`}>
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-md text-slate-400 hover:text-white hover:border-brand-500/30 transition-all hover:scale-110 active:scale-95 cursor-pointer z-30 shadow-lg light:bg-white/60 light:border-slate-200/80 light:text-slate-600 light:hover:text-slate-900 light:hover:border-brand-500/40 light:shadow-slate-200/30 group"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 transition-transform duration-500 rotate-0 group-hover:-rotate-12 group-hover:scale-110" />
        ) : (
          <Sun className="w-5 h-5 transition-transform duration-500 rotate-0 group-hover:rotate-90 group-hover:scale-110" />
        )}
      </button>

      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-950 light:from-[#f1f5f9] to-transparent pointer-events-none z-2 md:animate-slow-fade" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 light:from-[#f1f5f9] to-transparent pointer-events-none z-2 md:animate-slow-fade" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 animate-slow-fade hidden md:block">
        <div className="absolute inset-[-30%] w-[160%] h-[160%] animate-[spin_200s_linear_infinite] opacity-[0.85] mix-blend-normal">
          <div className="absolute top-[20%] left-[15%] w-[55vw] h-[55vw] min-w-[650px] min-h-[650px] bg-indigo-600/22 light:bg-indigo-500/15 blur-[160px] animate-blob-one" />
          <div className="absolute top-[15%] right-[15%] w-[65vw] h-[65vw] min-w-[750px] min-h-[750px] bg-purple-600/20 light:bg-purple-500/12 blur-[180px] animate-blob-two" />
          <div className="absolute bottom-[20%] left-[20%] w-[55vw] h-[55vw] min-w-[650px] min-h-[650px] bg-blue-600/18 light:bg-blue-500/12 blur-[160px] animate-blob-three" />
          <div className="absolute bottom-[15%] right-[15%] w-[60vw] h-[60vw] min-w-[700px] min-h-[700px] bg-amber-500/12 light:bg-amber-400/9 blur-[170px] animate-blob-four" />
        </div>
      </div>

      <svg className="absolute inset-0 w-full h-full opacity-[0.06] light:opacity-[0.03] pointer-events-none z-1 mix-blend-overlay animate-slow-fade hidden md:block">
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

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8 flex flex-col items-center animate-slide-down-fade">
          <div className="relative mb-4 group">
            <div className="absolute inset-0 rounded-full bg-brand-500/30 light:bg-brand-500/15 blur-xl group-hover:bg-brand-500/45 light:group-hover:bg-brand-500/25 transition-all duration-500 animate-pulse pointer-events-none" />
            <img
              src={logo}
              alt="TaskGraph Logo"
              fetchPriority="high"
              loading="eager"
              decoding="sync"
              onLoad={() => setLogoLoaded(true)}
              className={`relative h-16 sm:h-20 w-auto object-contain transition-opacity duration-700 ease-out ${logoLoaded ? 'opacity-100' : 'opacity-0'
                }`}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white light:text-slate-900">
            Task<span className="text-brand-500 bg-clip-text">Graph</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 mt-2">
            Semantic task tracker with AI dependency generator
          </p>
        </div>

        <div
          className="backdrop-blur-2xl bg-slate-950/40 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] light:bg-white/60 light:border-slate-200/80 light:shadow-[0_25px_50px_-12px_rgba(15,23,42,0.08)] animate-zoom-in-fade"
          style={{ animationDelay: '150ms' }}
        >
          <div className="relative flex border-b border-slate-800 light:border-slate-200/80 pb-4 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors duration-300 cursor-pointer ${isLogin ? 'text-brand-500' : 'text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800'
                }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors duration-300 cursor-pointer ${!isLogin ? 'text-brand-500' : 'text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800'
                }`}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
            <div
              className="absolute bottom-0 h-0.5 bg-brand-500 transition-all duration-300 ease-out"
              style={{
                left: isLogin ? '0%' : '50%',
                width: '50%',
                transform: 'translateY(1px)'
              }}
            />
          </div>

          {error && (
            <div className={`bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-red-400 animate-fade-in ${shakeToggle ? 'animate-shake' : 'animate-shake-alt'}`}>
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Authentication Error</p>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div
              className={`grid transition-all duration-300 ease-in-out ${isLogin ? 'grid-rows-[0fr] mb-0' : 'grid-rows-[1fr] mb-5'
                }`}
            >
              <div className="overflow-hidden px-1 py-1 -mx-1 -my-1">
                <div
                  className={`pb-1 space-y-2.5 transition-all duration-300 ease-out ${isLogin
                      ? 'opacity-0 -translate-y-2 pointer-events-none'
                      : 'opacity-100 translate-y-0 delay-150'
                    }`}
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <label className="block text-xs font-semibold text-slate-400 light:text-slate-500 shrink-0">Username</label>
                    {fieldErrors.displayName && (
                      <span className="text-[10px] font-medium text-red-400 animate-error-pop text-right leading-none">{fieldErrors.displayName}</span>
                    )}
                  </div>
                  <div className={`relative ${fieldErrors.displayName ? (shakeToggle ? 'animate-shake' : 'animate-shake-alt') : ''}`}>
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 z-10">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setFieldErrors(prev => ({ ...prev, displayName: undefined }));
                        setError(null);
                      }}
                      placeholder="John Doe"
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-950 light:bg-white border rounded-xl text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:outline-none transition-all duration-300 text-sm focus:ring-1 ${fieldErrors.displayName
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500 light:border-slate-200 light:focus:border-brand-500 light:focus:ring-brand-500'
                        }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 relative">
              <div className="flex justify-between items-baseline gap-2">
                <label className="block text-xs font-semibold text-slate-400 light:text-slate-500 shrink-0">Email Address</label>
                {fieldErrors.email && (
                  <span className="text-[10px] font-medium text-red-400 animate-error-pop text-right leading-none">{fieldErrors.email}</span>
                )}
              </div>
              <div className={`relative ${fieldErrors.email ? (shakeToggle ? 'animate-shake' : 'animate-shake-alt') : ''}`}>
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 z-10">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-950 light:bg-white border rounded-xl text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:outline-none transition-all duration-300 text-sm focus:ring-1 ${fieldErrors.email
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500 light:border-slate-200 light:focus:border-brand-500 light:focus:ring-brand-500'
                    }`}
                />
              </div>

              {showSuggestions && emailSuggestions.length > 0 && (
                <div className="absolute top-[calc(100%-4px)] left-0 right-0 mt-1 z-20 backdrop-blur-xl bg-slate-950/85 border border-white/10 rounded-xl overflow-hidden shadow-xl animate-dropdown-slide origin-top light:bg-white/95 light:border-slate-200/80 light:shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08)]">
                  {emailSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={() => {
                        setEmail(suggestion);
                        setEmailSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 light:text-slate-700 light:hover:text-slate-950 light:hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline gap-2">
                <label className="block text-xs font-semibold text-slate-400 light:text-slate-500 shrink-0">Password</label>
                {fieldErrors.password && (
                  <span className="text-[10px] font-medium text-red-400 animate-error-pop text-right leading-none">{fieldErrors.password}</span>
                )}
              </div>
              <div className={`relative ${fieldErrors.password ? (shakeToggle ? 'animate-shake' : 'animate-shake-alt') : ''}`}>
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none z-10">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors(prev => ({ ...prev, password: undefined }));
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-950 light:bg-white border rounded-xl text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:outline-none transition-all duration-300 text-sm focus:ring-1 ${fieldErrors.password
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500 light:border-slate-200 light:focus:border-brand-500 light:focus:ring-brand-500'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 light:hover:text-slate-700 transition-colors duration-200 cursor-pointer z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full h-10 mt-2 text-white font-medium rounded-xl flex items-center justify-center active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 text-sm cursor-pointer overflow-hidden shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-orange-600 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {loading ? (
                <div className="relative z-10 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <span
                    className={`absolute flex items-center justify-center gap-1.5 transition-all duration-300 ease-out ${isLogin ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2 pointer-events-none'
                      }`}
                  >
                    Sign In
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                  </span>
                  <span
                    className={`absolute flex items-center justify-center gap-1.5 transition-all duration-300 ease-out ${!isLogin ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2 pointer-events-none'
                      }`}
                  >
                    Create Account
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                  </span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
