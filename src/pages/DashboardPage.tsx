import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderPlus, LogOut, Settings2, ShieldCheck,
  Layers, Clock, ChevronRight, X, Sparkles, Server, Layout
} from 'lucide-react';
import { apiClient, getAiSettings, setAiSettings } from '../api/client';
import { authApi } from '../api/auth';

interface Project {
  id: string;
  name: string;
  description: string;
  techStack: {
    backend: string[];
    frontend: string[];
    other: string[];
  };
  status: 'PENDING_AI' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  completionPercent: number;
  totalEstimatedHours: number | null;
  totalLoggedHours: number | null;
  createdAt: string;
}

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'E-Commerce Store (Spring & React)',
    description: 'MVP интернет-магазина с авторизацией, каталогом товаров, корзиной и интеграцией с СБП.',
    techStack: {
      backend: ['Java', 'Spring Boot', 'PostgreSQL'],
      frontend: ['React', 'TypeScript', 'Tailwind CSS'],
      other: ['Redis', 'Docker'],
    },
    status: 'ACTIVE',
    completionPercent: 42,
    totalEstimatedHours: 64,
    totalLoggedHours: 28,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'TaskGraph Core Platform',
    description: 'Разработка семантического граф-ориентированного таск-трекера с интеграцией LLM моделей.',
    techStack: {
      backend: ['Java', 'Spring Boot', 'Python', 'FastAPI'],
      frontend: ['React', 'TypeScript', 'Tailwind CSS', 'ReactFlow'],
      other: ['Ollama', 'Gemini API'],
    },
    status: 'ACTIVE',
    completionPercent: 12,
    totalEstimatedHours: 120,
    totalLoggedHours: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Блог на Next.js & Headless CMS',
    description: 'Адаптивный корпоративный блог с автоматической генерацией SEO мета-описаний.',
    techStack: {
      backend: ['Node.js', 'GraphQL'],
      frontend: ['Next.js', 'React', 'Tailwind CSS'],
      other: ['Strapi', 'Vercel'],
    },
    status: 'COMPLETED',
    completionPercent: 100,
    totalEstimatedHours: 32,
    totalLoggedHours: 30,
    createdAt: new Date().toISOString(),
  }
];

const generateMockProjectId = () => {
  return Date.now().toString();
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ displayName: string; email: string } | null>(() => {
    const storedUser = localStorage.getItem('userProfile');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [aiProvider, setAiProvider] = useState(() => {
    const saved = getAiSettings();
    return saved?.provider || 'gemini';
  });
  const [aiApiKey, setAiApiKey] = useState(() => {
    const saved = getAiSettings();
    return saved?.apiKey || '';
  });
  const [aiModel, setAiModel] = useState(() => {
    const saved = getAiSettings();
    return saved?.model || 'gemini-2.5-flash';
  });
  const [ollamaUrl, setOllamaUrl] = useState(() => {
    const saved = getAiSettings();
    return saved?.ollamaBaseUrl || 'http://localhost:11434';
  });

  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [techBackend, setTechBackend] = useState('');
  const [techFrontend, setTechFrontend] = useState('');
  const [techOther, setTechOther] = useState('');
  const [teamSize, setTeamSize] = useState(1);
  const [aiEstimate, setAiEstimate] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/projects');
      const content = response.data?.content || response.data || [];
      if (Array.isArray(content) && content.length > 0) {
        setProjects(content);
      } else {
        setProjects(MOCK_PROJECTS);
      }
    } catch (err) {
      console.warn('Failed to load projects from backend, using mocks.', err);
      setProjects(MOCK_PROJECTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userProfile) {
      authApi.getProfile()
        .then(user => {
          setUserProfile(user);
          localStorage.setItem('userProfile', JSON.stringify(user));
        })
        .catch(() => {
          setUserProfile({ displayName: 'Демо Пользователь', email: 'demo@taskgraph.ru' });
        });
    }

    setTimeout(() => {
      fetchProjects();
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('userProfile');
      navigate('/auth');
    }
  };

  const saveAiSettingsHandler = (e: React.FormEvent) => {
    e.preventDefault();
    setAiSettings({
      provider: aiProvider,
      apiKey: aiApiKey,
      model: aiModel,
      ollamaBaseUrl: ollamaUrl,
    });
    setIsAiModalOpen(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingProject(true);

    const payload = {
      name: projectName,
      description: projectDesc,
      techStack: {
        backend: techBackend.split(',').map(s => s.trim()).filter(Boolean),
        frontend: techFrontend.split(',').map(s => s.trim()).filter(Boolean),
        other: techOther.split(',').map(s => s.trim()).filter(Boolean),
      },
      teamSize,
      aiEstimate,
    };

    try {
      const response = await apiClient.post('/api/v1/projects', payload);
      const newProj = response.data;
      setProjects(prev => [newProj, ...prev]);
      setIsCreateModalOpen(false);
      resetCreateForm();
    } catch (err) {
      console.warn('Backend failed to create project, adding locally for demo.', err);

      const mockNewProj: Project = {
        id: generateMockProjectId(),
        name: payload.name,
        description: payload.description,
        techStack: payload.techStack,
        status: payload.aiEstimate ? 'PENDING_AI' : 'ACTIVE',
        completionPercent: 0,
        totalEstimatedHours: payload.aiEstimate ? 40 : 0,
        totalLoggedHours: 0,
        createdAt: new Date().toISOString(),
      };
      setProjects(prev => [mockNewProj, ...prev]);
      setIsCreateModalOpen(false);
      resetCreateForm();
    } finally {
      setCreatingProject(false);
    }
  };

  const resetCreateForm = () => {
    setProjectName('');
    setProjectDesc('');
    setTechBackend('');
    setTechFrontend('');
    setTechOther('');
    setTeamSize(1);
    setAiEstimate(true);
  };

  const getStatusStyle = (status: Project['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING_AI':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
      case 'ACTIVE':
      default:
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    }
  };

  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'COMPLETED': return 'Завершен';
      case 'PENDING_AI': return 'Генерация ИИ';
      case 'ACTIVE': return 'Активен';
      case 'ARCHIVED': return 'В архиве';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <nav className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600/10 border border-violet-600/20 rounded-xl text-violet-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">
              Task<span className="text-violet-500">Graph</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-300"
              title="Настройки ИИ"
            >
              <Settings2 className="w-4 h-4 text-violet-400" />
              ИИ-Модель
            </button>

            <div className="flex items-center gap-2.5 pl-4 border-l border-slate-900">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center font-bold text-violet-300 text-sm">
                {userProfile?.displayName?.substring(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-200">{userProfile?.displayName}</p>
                <p className="text-[10px] text-slate-500 font-medium">{userProfile?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
              Мои Проекты
            </h1>
            <p className="text-sm text-slate-400">
              Управляйте графами задач и отслеживайте прогресс с помощью ИИ
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] text-white font-medium rounded-xl flex items-center gap-2 shadow-lg shadow-violet-900/10 transition-all text-sm cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            Создать проект
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-slate-900 bg-slate-900/20 rounded-3xl p-12 text-center">
            <FolderPlus className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-1">Проектов пока нет</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              Создайте свой первый проект и ИИ декомпозирует его на граф взаимосвязанных задач.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              Инициировать первый проект
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group relative backdrop-blur-md bg-slate-900/40 hover:bg-slate-900/70 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-600/0 via-violet-600/0 to-violet-600/5 group-hover:to-violet-600/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border rounded-full ${getStatusStyle(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors mb-2 line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    {project.techStack.backend.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.techStack.backend.slice(0, 3).map((tech) => (
                          <span key={tech} className="text-[9px] font-semibold bg-slate-950 border border-slate-900 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Server className="w-2.5 h-2.5 text-violet-400" />
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.techStack.frontend.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.techStack.frontend.slice(0, 3).map((tech) => (
                          <span key={tech} className="text-[9px] font-semibold bg-slate-950 border border-slate-900 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Layout className="w-2.5 h-2.5 text-indigo-400" />
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-900/60 mt-auto">
                  <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1.5">
                    <span>Выполнено</span>
                    <span>{project.completionPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
                      style={{ width: `${project.completionPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        {project.totalEstimatedHours ? `${project.totalEstimatedHours}ч` : '0ч'} оценка
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {project.totalLoggedHours ? `${project.totalLoggedHours}ч` : '0ч'} факт
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        <p>© 2026 TaskGraph Project. Все права защищены.</p>
      </footer>

      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-violet-400" />
              <h3 className="text-base font-bold text-white">Настройки ИИ провайдера</h3>
            </div>

            <form onSubmit={saveAiSettingsHandler} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Провайдер</label>
                <select
                  value={aiProvider}
                  onChange={(e) => {
                    const prov = e.target.value;
                    setAiProvider(prov);
                    if (prov === 'gemini') setAiModel('gemini-2.5-flash');
                    else if (prov === 'openai') setAiModel('gpt-4o-mini');
                    else if (prov === 'ollama') setAiModel('llama3');
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                >
                  <option value="gemini">Google Gemini API (BYOK)</option>
                  <option value="openai">OpenAI API (BYOK)</option>
                  <option value="ollama">Ollama (Локальный запуск)</option>
                </select>
              </div>

              {aiProvider !== 'ollama' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Личный API-ключ</label>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="Вставьте ваш API ключ"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Ollama API URL</label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Модель</label>
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder={aiProvider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2 text-[10px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <p>Ключи шифруются и передаются в заголовках запроса. Бэкенд не сохраняет личные API-ключи в базе данных.</p>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl text-sm transition-all cursor-pointer"
              >
                Сохранить настройки
              </button>
            </form>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <FolderPlus className="w-5 h-5 text-violet-400" />
              <h3 className="text-base font-bold text-white">Инициация нового проекта</h3>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Название проекта</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Например: E-Commerce Store"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Описание цели и требований</label>
                <textarea
                  required
                  rows={3}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Детально опишите, что должен делать проект. Наример: MVP интернет-магазина с авторизацией, каталогом продуктов, корзиной и оплатой..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Бэкенд стек (через запятую)</label>
                  <input
                    type="text"
                    value={techBackend}
                    onChange={(e) => setTechBackend(e.target.value)}
                    placeholder="Java, Spring Boot, PostgreSQL"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Фронтенд стек (через запятую)</label>
                  <input
                    type="text"
                    value={techFrontend}
                    onChange={(e) => setTechFrontend(e.target.value)}
                    placeholder="React, TypeScript, Tailwind"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Инфраструктура / Другое (через запятую)</label>
                <input
                  type="text"
                  value={techOther}
                  onChange={(e) => setTechOther(e.target.value)}
                  placeholder="Docker, Redis, GitHub Actions"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-y border-slate-800/60">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-200">Автоматическая оценка ИИ</label>
                  <p className="text-[10px] text-slate-500">Попросить ИИ рассчитать трудозатраты (estimatedHours)</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiEstimate}
                  onChange={(e) => setAiEstimate(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 text-violet-600 focus:ring-violet-500 bg-slate-950 accent-violet-600 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={creatingProject}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {creatingProject ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Генерация архитектуры графа...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Запустить декомпозицию ИИ
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
