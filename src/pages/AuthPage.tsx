import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { authApi } from '../api/auth';
import axios from 'axios';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDemoMode = () => {
    localStorage.setItem('accessToken', 'demo-access-token');
    localStorage.setItem('refreshToken', 'demo-refresh-token');
    localStorage.setItem('userProfile', JSON.stringify({
      displayName: 'Демо Пользователь',
      email: 'demo@taskgraph.ru',
    }));
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await authApi.login({ email, password });
      } else {
        await authApi.register({ email, password, displayName });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      const apiMessage = axios.isAxiosError(err) ? err.response?.data?.message : null;
      setError(
        apiMessage ||
        'Не удалось подключиться к бэкенду. Вы можете войти в демо-режим для осмотра интерфейса.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden px-4">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="absolute w-[800px] h-[800px] border border-slate-900/40 rounded-full pointer-events-none animate-[spin_120s_linear_infinite]" />
      <div className="absolute w-[600px] h-[600px] border border-dashed border-slate-900/20 rounded-full pointer-events-none animate-[spin_80s_linear_infinite]" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-4 text-violet-400">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Task<span className="text-violet-500 bg-clip-text">Graph</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Семантический таск-трекер с ИИ-генератором зависимостей
          </p>
        </div>

        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-2xl">
          <div className="flex border-b border-slate-800 pb-4 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${isLogin ? 'text-violet-400 border-b-2 border-violet-500 -mb-[18px]' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <LogIn className="w-4 h-4" />
              Вход
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${!isLogin ? 'text-violet-400 border-b-2 border-violet-500 -mb-[18px]' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <UserPlus className="w-4 h-4" />
              Регистрация
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Ошибка авторизации</p>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Имя пользователя</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Алексей Иванов"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Электронная почта</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Пароль</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 disabled:opacity-50 disabled:pointer-events-none transition-all text-sm cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Войти' : 'Создать аккаунт'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest">или</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={handleDemoMode}
            className="w-full py-2.5 px-4 bg-slate-800/40 hover:bg-slate-800/80 active:scale-[0.98] border border-slate-700/50 text-slate-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
          >
            Войти в Демо-режим
          </button>
        </div>
      </div>
    </div>
  );
}
