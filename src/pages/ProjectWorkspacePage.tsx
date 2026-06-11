import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Layers, Clock, AlertTriangle,
  HelpCircle, ChevronRight, Play, Check, Send, Layout, Server, X, HelpCircle as DocIcon
} from 'lucide-react';
import { apiClient } from '../api/client';

interface TaskNode {
  id: string;
  title: string;
  description: string;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  category: 'BACKEND' | 'FRONTEND' | 'DEVOPS' | 'TESTING' | 'DOCUMENTATION' | 'DESIGN' | 'OTHER';
  positionX: number;
  positionY: number;
  estimatedHours: number;
  loggedHours: number;
  checklist: string[];
  pitfalls: string[];
  links: { title: string; url: string }[];
}

const MOCK_TASKS: TaskNode[] = [
  {
    id: 't1',
    title: 'Инициализация репозиториев и БД',
    description: 'Развертывание базового окружения, создание структуры баз данных Postgres, запуск пустых проектов Spring Boot и React Vite.',
    status: 'COMPLETED',
    category: 'DEVOPS',
    positionX: 80,
    positionY: 220,
    estimatedHours: 4,
    loggedHours: 4.5,
    checklist: [
      'Создать PostgreSQL базу данных и настроить схемы',
      'Инициализировать Spring Boot бэкенд проект',
      'Инициализировать React TypeScript Vite фронтенд проект',
      'Настроить Docker Compose для локального развертывания'
    ],
    pitfalls: [
      'Убедитесь, что версии Node.js и Java соответствуют требованиям сборки',
      'Проверьте доступность портов 8080 и 5173 перед запуском докер-контейнеров'
    ],
    links: [
      { title: 'Документация Spring Boot', url: 'https://spring.io/projects/spring-boot' },
      { title: 'Документация React Vite', url: 'https://vite.dev' }
    ]
  },
  {
    id: 't2',
    title: 'Реализация API авторизации (Spring)',
    description: 'Разработка контроллеров и сервисов для регистрации пользователей, входа, генерации JWT-токенов (access/refresh) и валидации сессий.',
    status: 'IN_PROGRESS',
    category: 'BACKEND',
    positionX: 300,
    positionY: 100,
    estimatedHours: 8,
    loggedHours: 3.5,
    checklist: [
      'Создать сущность User и репозиторий в Spring Data JPA',
      'Реализовать эндпоинты /auth/register и /auth/login',
      'Разработать утилиту для генерации и подписи JWT токенов',
      'Создать логику обновления токенов по refresh token (/auth/refresh)'
    ],
    pitfalls: [
      'Ни в коем случае не храните секретный ключ JWT в коде. Используйте конфигурацию переменных окружения',
      'Время жизни access token должно быть минимальным (например, 15 минут) для обеспечения безопасности'
    ],
    links: [
      { title: 'JWT.io Справочник', url: 'https://jwt.io' }
    ]
  },
  {
    id: 't3',
    title: 'Разметка UI страниц и Роутинг (React)',
    description: 'Верстка страниц авторизации, личного кабинета и рабочего пространства проекта. Настройка React Router.',
    status: 'AVAILABLE',
    category: 'FRONTEND',
    positionX: 300,
    positionY: 340,
    estimatedHours: 6,
    loggedHours: 0,
    checklist: [
      'Установить и настроить Tailwind CSS v4',
      'Создать структуру папок: /pages, /components, /api',
      'Настроить React Router с приватными и публичными путями',
      'Сформировать шаблоны AuthPage, DashboardPage и Workspace'
    ],
    pitfalls: [
      'Правильно настройте перехват неавторизованных пользователей для защиты рабочих роутов',
      'Используйте CSS-переменные для быстрого переключения цветовой гаммы темы'
    ],
    links: [
      { title: 'Документация React Router', url: 'https://reactrouter.com' }
    ]
  },
  {
    id: 't4',
    title: 'Интеграция Spring Security фильтров',
    description: 'Настройка цепочки фильтров безопасности, прав доступа к эндпоинтам и конфигурация CORS для работы с фронтендом.',
    status: 'LOCKED',
    category: 'BACKEND',
    positionX: 520,
    positionY: 100,
    estimatedHours: 10,
    loggedHours: 0,
    checklist: [
      'Определить SecurityFilterChain в Spring Bean конфигурации',
      'Создать JwtRequestFilter для парсинга и валидации заголовков Authorization',
      'Настроить CORS правила для локального домена фронтенда (localhost:5173)'
    ],
    pitfalls: [
      'Неверная конфигурация CORS может полностью заблокировать отправку запросов от React клиента',
      'Убедитесь, что /auth/* эндпоинты исключены из обязательной аутентификации фильтра'
    ],
    links: [
      { title: 'Spring Security Guide', url: 'https://spring.io/guides/topicals/spring-security-architecture' }
    ]
  },
  {
    id: 't5',
    title: 'Связка API с Axios и Интерцепторами',
    description: 'Создание Axios-клиента на фронтенде, автоматическая подстановка заголовка Bearer, логика повтора запросов при обновлении сессии.',
    status: 'LOCKED',
    category: 'FRONTEND',
    positionX: 740,
    positionY: 220,
    estimatedHours: 8,
    loggedHours: 0,
    checklist: [
      'Инициализировать клиент Axios с baseURL',
      'Написать request-интерцептор для вставки accessToken из localStorage',
      'Реализовать response-интерцептор для ловли 401 ошибки и авто-обновления JWT'
    ],
    pitfalls: [
      'Обработайте сценарий бесконечной петли запросов, если эндпоинт обновления токенов сам возвращает 401'
    ],
    links: []
  }
];

const MOCK_EDGES = [
  { from: 't1', to: 't2' },
  { from: 't1', to: 't3' },
  { from: 't2', to: 't4' },
  { from: 't3', to: 't5' },
  { from: 't4', to: 't5' }
];

interface ApiTaskNode {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  category: TaskNode['category'] | null;
  positionX: number;
  positionY: number;
  estimatedHours: number | null;
  loggedHours: number;
  enrichment?: {
    checklist?: string[] | null;
    pitfalls?: string[] | null;
    links?: { title: string; url: string }[] | null;
  } | null;
}

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskNode[]>(MOCK_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('t2'); // Start with task 2 selected
  const [projectName, setProjectName] = useState('E-Commerce Store');
  const [projectDesc, setProjectDesc] = useState('');
  const [completionPercent, setCompletionPercent] = useState(42);

  const [isMutateOpen, setIsMutateOpen] = useState(false);
  const [mutatePrompt, setMutatePrompt] = useState('');
  const [mutating, setMutating] = useState(false);

  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);
  const [blueprintData, setBlueprintData] = useState<{ c4: string; seq: string } | null>(null);
  const [loadingBlueprint, setLoadingBlueprint] = useState(false);

  useEffect(() => {
    apiClient.get(`/api/v1/projects/${projectId}`)
      .then(res => {
        setProjectName(res.data.name);
        setProjectDesc(res.data.description);
        setCompletionPercent(res.data.completionPercent || 42);
      })
      .catch(() => { });

    apiClient.get(`/api/v1/projects/${projectId}/graph`)
      .then(res => {
        if (res.data.nodes && res.data.nodes.length > 0) {
          const mappedNodes = res.data.nodes.map((node: ApiTaskNode) => ({
            ...node,
            checklist: node.enrichment?.checklist || [],
            pitfalls: node.enrichment?.pitfalls || [],
            links: node.enrichment?.links || []
          }));
          setTasks(mappedNodes);
          setSelectedTaskId(mappedNodes[0].id);
        }
      })
      .catch(() => { });
  }, [projectId]);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const handleToggleStatus = (taskId: string) => {
    setTasks(prevTasks => {
      const updated = prevTasks.map(task => {
        if (task.id === taskId) {
          let nextStatus: TaskNode['status'] = 'AVAILABLE';
          if (task.status === 'AVAILABLE') nextStatus = 'IN_PROGRESS';
          else if (task.status === 'IN_PROGRESS') nextStatus = 'COMPLETED';
          else if (task.status === 'COMPLETED') nextStatus = 'AVAILABLE';
          return { ...task, status: nextStatus };
        }
        return task;
      });

      const t1 = updated.find(t => t.id === 't1')!;
      const t2 = updated.find(t => t.id === 't2')!;
      const t3 = updated.find(t => t.id === 't3')!;
      const t4 = updated.find(t => t.id === 't4')!;
      const t5 = updated.find(t => t.id === 't5')!;

      if (t1.status !== 'COMPLETED') {
        t2.status = 'LOCKED';
        t3.status = 'LOCKED';
        t4.status = 'LOCKED';
        t5.status = 'LOCKED';
      } else {
        if (t2.status === 'LOCKED') t2.status = 'AVAILABLE';
        if (t3.status === 'LOCKED') t3.status = 'AVAILABLE';

        if (t2.status !== 'COMPLETED') {
          t4.status = 'LOCKED';
          t5.status = 'LOCKED';
        } else {
          if (t4.status === 'LOCKED') t4.status = 'AVAILABLE';

          if (t3.status !== 'COMPLETED' || t4.status !== 'COMPLETED') {
            t5.status = 'LOCKED';
          } else {
            if (t5.status === 'LOCKED') t5.status = 'AVAILABLE';
          }
        }
      }

      const completedCount = updated.filter(t => t.status === 'COMPLETED').length;
      setCompletionPercent(Math.round((completedCount / updated.length) * 100));

      return updated;
    });
  };

  const handleMutateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMutating(true);

    setTimeout(() => {
      const newNode: TaskNode = {
        id: 't6',
        title: 'Интеграция Redis для кэширования сессий',
        description: 'Настройка Redis клиента, подключение его к Spring Boot Cache Manager, кэширование результатов авторизации.',
        status: 'LOCKED',
        category: 'BACKEND',
        positionX: 520,
        positionY: 220,
        estimatedHours: 6,
        loggedHours: 0,
        checklist: [
          'Установить Redis через Docker Compose',
          'Добавить зависимости Spring Redis в pom.xml',
          'Реализовать кэширование для токенов авторизации'
        ],
        pitfalls: ['Убедитесь, что сериализаторы Redis настроены корректно, иначе получите ошибки десериализации JSON'],
        links: []
      };

      setTasks(prev => {
        if (prev.some(t => t.id === 't6')) return prev;

        MOCK_EDGES.push({ from: 't2', to: 't6' });
        MOCK_EDGES.push({ from: 't6', to: 't5' });

        return [...prev, newNode];
      });

      setMutating(false);
      setIsMutateOpen(false);
      setMutatePrompt('');
      setSelectedTaskId('t6');
    }, 2000);
  };

  const handleRequestBlueprint = () => {
    setIsBlueprintOpen(true);
    setLoadingBlueprint(true);

    setTimeout(() => {
      setBlueprintData({
        c4: `graph TD
  User((Пользователь)) -->|HTTPS| WebClient[React SPA Client]
  WebClient -->|API REST| SpringBoot[Spring Boot Core API]
  SpringBoot -->|REST API| FastAPI[AI Bridge FastAPI]
  FastAPI -->|HTTPS SDK| Gemini[Google Gemini LLM]
  SpringBoot -->|TCP| Database[(PostgreSQL DB)]`,
        seq: `sequenceDiagram
  actor User as Пользователь
  participant Client as React Клиент
  participant Server as Spring Boot API
  participant DB as База Данных

  User->>Client: Ввод логина и пароля
  Client->>Server: POST /api/v1/auth/login
  Server->>DB: Поиск пользователя по Email
  DB-->>Server: Данные пользователя (хэш пароля)
  Server->>Server: Сверка паролей (BCrypt)
  Server->>Server: Генерация Access & Refresh JWT
  Server-->>Client: 200 OK (AuthResponse с JWT)
  Client->>Client: Сохранение токенов в LocalStorage
  Client-->>User: Перенаправление на Dashboard`
      });
      setLoadingBlueprint(false);
    }, 1500);
  };

  const getCategoryIcon = (category: TaskNode['category']) => {
    switch (category) {
      case 'BACKEND': return <Server className="w-3.5 h-3.5 text-violet-400" />;
      case 'FRONTEND': return <Layout className="w-3.5 h-3.5 text-indigo-400" />;
      case 'DEVOPS': return <Layers className="w-3.5 h-3.5 text-blue-400" />;
      default: return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getNodeColor = (status: TaskNode['status'], isSelected: boolean) => {
    if (isSelected) return 'border-violet-500 ring-2 ring-violet-500/30 bg-slate-900';
    switch (status) {
      case 'COMPLETED': return 'border-emerald-500 bg-slate-900/60 opacity-80';
      case 'IN_PROGRESS': return 'border-amber-500 bg-slate-900 animate-pulse';
      case 'AVAILABLE': return 'border-slate-700 bg-slate-900/40 hover:border-slate-500';
      case 'LOCKED':
      default:
        return 'border-slate-950 bg-slate-950/20 text-slate-600 opacity-60';
    }
  };

  const getStatusText = (status: TaskNode['status']) => {
    switch (status) {
      case 'COMPLETED': return 'Выполнено';
      case 'IN_PROGRESS': return 'В работе';
      case 'AVAILABLE': return 'Доступно';
      case 'LOCKED': return 'Заблокировано';
    }
  };

  const getStatusBadgeColor = (status: TaskNode['status']) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'AVAILABLE': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'LOCKED': return 'bg-slate-500/10 text-slate-500 border-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col h-screen overflow-hidden">
      <header className="border-b border-slate-900 bg-slate-950 px-6 h-16 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-xl transition-all cursor-pointer"
            title="Назад на Дашборд"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white leading-none" title={projectDesc || undefined}>{projectName}</h1>
              <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider animate-pulse">
                Фаза 1
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Рабочее пространство графа задач</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold">Прогресс проекта</span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <div className="w-28 h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-200">{completionPercent}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestBlueprint}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Архитектурный рентген
            </button>
            <button
              onClick={() => setIsMutateOpen(true)}
              className="py-1.5 px-3 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-xs font-bold rounded-xl text-violet-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-bounce" />
              Мутировать граф (ИИ)
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        <div className="flex-1 relative bg-slate-950 overflow-auto select-none p-8" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>

          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-300 mb-1">Справка по холсту:</p>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Выполнена</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> В работе</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-700" /> Доступна</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-950 border border-slate-800" /> Заблокирована</div>
            <p className="text-[9px] text-slate-500 mt-1 italic">* Кликните на узел для открытия деталей</p>
            <p className="text-[9px] text-slate-500 italic">* Дважды кликните для переключения статуса (демо)</p>
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '1000px', minHeight: '600px' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b" />
              </marker>
              <marker id="arrow-completed" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
              </marker>
            </defs>

            {MOCK_EDGES.map((edge, idx) => {
              const fromNode = tasks.find(t => t.id === edge.from);
              const toNode = tasks.find(t => t.id === edge.to);
              if (!fromNode || !toNode) return null;

              const startX = fromNode.positionX + 200;
              const startY = fromNode.positionY + 35;
              const endX = toNode.positionX;
              const endY = toNode.positionY + 35;

              const isCompleted = fromNode.status === 'COMPLETED';
              const isActive = fromNode.status === 'IN_PROGRESS' || (fromNode.status === 'COMPLETED' && toNode.status === 'AVAILABLE');
              const strokeColor = isCompleted ? '#10b981' : isActive ? '#6d28d9' : '#1e293b';
              const strokeDash = toNode.status === 'LOCKED' ? '5,5' : 'none';
              const markerId = isCompleted ? 'url(#arrow-completed)' : isActive ? 'url(#arrow-active)' : 'url(#arrow)';

              const controlX1 = startX + 50;
              const controlY1 = startY;
              const controlX2 = endX - 50;
              const controlY2 = endY;
              const d = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

              return (
                <path
                  key={`${edge.from}-${edge.to}-${idx}`}
                  d={d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray={strokeDash}
                  markerEnd={markerId}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 pointer-events-none" style={{ minWidth: '1000px', minHeight: '600px' }}>
            {tasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  onDoubleClick={() => handleToggleStatus(task.id)}
                  style={{ left: `${task.positionX}px`, top: `${task.positionY}px` }}
                  className={`absolute w-[200px] h-[72px] rounded-xl border-2 p-3.5 select-none transition-all duration-300 pointer-events-auto flex flex-col justify-between cursor-pointer ${getNodeColor(task.status, isSelected)}`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-[11px] text-white line-clamp-1 truncate flex-1 leading-tight">{task.title}</span>
                    <span className="shrink-0">{getCategoryIcon(task.category)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2 font-medium">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      {task.estimatedHours}ч
                    </span>
                    <span className={`px-1.5 py-0.2 border rounded-md text-[8px] font-bold ${getStatusBadgeColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="w-[360px] bg-slate-900/60 border-l border-slate-900 shrink-0 flex flex-col overflow-y-auto">
          {selectedTask ? (
            <div className="flex-1 flex flex-col">
              <div className="p-5 border-b border-slate-900 bg-slate-900/20">
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 border rounded-full ${getStatusBadgeColor(selectedTask.status)}`}>
                    {getStatusText(selectedTask.status)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {selectedTask.category}
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-white leading-snug">{selectedTask.title}</h2>
              </div>

              <div className="p-5 space-y-5 flex-1">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Описание задачи</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedTask.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950/60 border border-slate-900 rounded-xl p-3 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500">Оценка ИИ</span>
                    <p className="text-base font-extrabold text-violet-400 mt-0.5">{selectedTask.estimatedHours} ч</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500">Залогировано</span>
                    <p className="text-base font-extrabold text-slate-300 mt-0.5">{selectedTask.loggedHours} ч</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Чек-лист ИИ (Декомпозиция)</h4>
                  {selectedTask.checklist.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Скелет сгенерирован. Фоновое обогащение еще не завершено.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedTask.checklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-normal">
                          <span className={`p-0.5 rounded-md mt-0.5 ${selectedTask.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-700'}`}>
                            <Check className="w-3 h-3" />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {selectedTask.pitfalls.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Подводные камни ИИ</h4>
                    <div className="space-y-2">
                      {selectedTask.pitfalls.map((item, idx) => (
                        <div key={idx} className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex items-start gap-2 text-xs text-red-400 leading-normal">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.links.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Полезные ссылки</h4>
                    <div className="space-y-1.5">
                      {selectedTask.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white transition-all"
                        >
                          <span className="flex items-center gap-2 truncate font-medium">
                            <DocIcon className="w-3.5 h-3.5 text-violet-400" />
                            {link.title}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-900 bg-slate-900/10 mt-auto flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => handleToggleStatus(selectedTask.id)}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${selectedTask.status === 'COMPLETED'
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700/80 hover:text-slate-300'
                      : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/25'
                    }`}
                >
                  {selectedTask.status === 'COMPLETED' ? (
                    <>Сбросить статус</>
                  ) : selectedTask.status === 'IN_PROGRESS' ? (
                    <><Check className="w-3.5 h-3.5" /> Завершить задачу</>
                  ) : (
                    <><Play className="w-3.5 h-3.5" /> Взять в работу</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <Layers className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-xs">Выберите задачу на холсте для просмотра детального описания и чек-листов.</p>
            </div>
          )}
        </aside>
      </div>

      {isMutateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsMutateOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
              <h3 className="text-base font-bold text-white">Динамическая мутация графа</h3>
            </div>

            <form onSubmit={handleMutateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Что добавить или изменить в проекте?</label>
                <textarea
                  required
                  rows={3}
                  value={mutatePrompt}
                  onChange={(e) => setMutatePrompt(e.target.value)}
                  placeholder="Пример: Хочу добавить Redis для кэширования продуктов и токенов"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 text-sm resize-none"
                />
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-[10px] text-slate-400">
                ИИ проанализирует текущий граф задач, найдет оптимальное место для интеграции новой задачи и встроит её в ациклический порядок без полной перегенерации проекта.
              </div>

              <button
                type="submit"
                disabled={mutating}
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {mutating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Мутация графа...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Отправить запрос
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {isBlueprintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setIsBlueprintOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <Layers className="w-5 h-5 text-indigo-400 animate-pulse" />
              <h3 className="text-base font-bold text-white">Архитектурный рентген (Mermaid Blueprint)</h3>
            </div>

            {loadingBlueprint ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-xs">Генерация Mermaid UML схем на основе графа...</p>
              </div>
            ) : blueprintData ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2">Диаграмма развертывания (C4 Context)</h4>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-400 text-[10px] font-mono overflow-x-auto leading-relaxed">
                    {blueprintData.c4}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2">Диаграмма последовательности (Авторизация JWT)</h4>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-400 text-[10px] font-mono overflow-x-auto leading-relaxed">
                    {blueprintData.seq}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
