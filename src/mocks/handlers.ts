import { http, HttpResponse } from 'msw';

interface SavedAiSettings {
  provider: 'gemini' | 'openai' | 'anthropic' | 'groq' | 'mistral' | 'ollama' | null;
  model: string | null;
  apiKeyMasked: string | null;
  hasApiKey: boolean;
  ollamaBaseUrl: string | null;
  providerSettings: Record<string, unknown> | null;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  aiSettings: SavedAiSettings | null;
  createdAt: string;
}

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
  ownerId: string;
  teamSize: number;
  aiEstimate: boolean;
  totalEstimatedHours: number | null;
  totalLoggedHours: number | null;
  completionPercent: number;
  createdAt: string;
  updatedAt: string;
}

const userProfile: UserProfile = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'dev@taskgraph.ru',
  displayName: 'Разработчик TaskGraph',
  avatarUrl: null,
  aiSettings: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKeyMasked: 'AIza...xxxx',
    hasApiKey: true,
    ollamaBaseUrl: null,
    providerSettings: null
  },
  createdAt: new Date().toISOString()
};

const projectsList: Project[] = [
  {
    id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'E-Commerce Store (Spring & React)',
    description: 'MVP интернет-магазина с авторизацией, каталогом товаров, корзиной и интеграцией с СБП.',
    techStack: {
      backend: ['Java', 'Spring Boot', 'PostgreSQL'],
      frontend: ['React', 'TypeScript', 'Tailwind CSS'],
      other: ['Redis', 'Docker'],
    },
    status: 'ACTIVE',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 3,
    aiEstimate: true,
    totalEstimatedHours: 36,
    totalLoggedHours: 8,
    completionPercent: 20,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const projectGraphs: Record<string, {
  projectId: string;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  enrichmentStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}> = {
  '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d': {
    projectId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    nodes: [
      {
        id: 't1',
        projectId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        title: 'Инициализация репозиториев и БД',
        description: 'Развертывание базового окружения, создание структуры баз данных Postgres, запуск пустых проектов Spring Boot и React Vite.',
        status: 'COMPLETED',
        category: 'DEVOPS',
        positionX: 80,
        positionY: 220,
        estimatedHours: 4,
        loggedHours: 4,
        enrichment: {
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
        }
      },
      {
        id: 't2',
        projectId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        title: 'Реализация API авторизации (Spring)',
        description: 'Разработка контроллеров и сервисов для регистрации пользователей, входа, генерации JWT-токенов (access/refresh) и валидации сессий.',
        status: 'IN_PROGRESS',
        category: 'BACKEND',
        positionX: 300,
        positionY: 100,
        estimatedHours: 8,
        loggedHours: 4,
        enrichment: {
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
        }
      },
      {
        id: 't3',
        projectId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        title: 'Разметка UI страниц и Роутинг (React)',
        description: 'Верстка страниц авторизации, личного кабинета и рабочего пространства проекта. Настройка React Router.',
        status: 'AVAILABLE',
        category: 'FRONTEND',
        positionX: 300,
        positionY: 340,
        estimatedHours: 6,
        loggedHours: 0,
        enrichment: {
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
        }
      },
      {
        id: 't4',
        projectId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        title: 'Интеграция Spring Security фильтров',
        description: 'Настройка цепочки фильтров безопасности, прав доступа к эндпоинтам и конфигурация CORS для работы с фронтендом.',
        status: 'LOCKED',
        category: 'BACKEND',
        positionX: 520,
        positionY: 100,
        estimatedHours: 10,
        loggedHours: 0,
        enrichment: {
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
        }
      },
      {
        id: 't5',
        projectId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        title: 'Связка API с Axios и Интерцепторами',
        description: 'Создание Axios-клиента на фронтенде, автоматическая подстановка заголовка Bearer, логика повтора запросов при обновлении сессии.',
        status: 'LOCKED',
        category: 'FRONTEND',
        positionX: 740,
        positionY: 220,
        estimatedHours: 8,
        loggedHours: 0,
        enrichment: {
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
      }
    ],
    edges: [
      { id: 'e1', sourceTaskId: 't1', targetTaskId: 't2' },
      { id: 'e2', sourceTaskId: 't1', targetTaskId: 't3' },
      { id: 'e3', sourceTaskId: 't2', targetTaskId: 't4' },
      { id: 'e4', sourceTaskId: 't3', targetTaskId: 't5' },
      { id: 'e5', sourceTaskId: 't4', targetTaskId: 't5' }
    ],
    enrichmentStatus: 'COMPLETED'
  }
};

export const handlers = [
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;

    if (data.email === 'server-error@example.com') {
      return new HttpResponse(null, { status: 500 });
    }

    if (data.email === 'error@example.com' || data.password === 'error') {
      return HttpResponse.json(
        { message: 'Неверный логин или пароль.' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      user: {
        ...userProfile,
        email: data.email as string || userProfile.email
      }
    });
  }),

  http.post('*/api/v1/auth/register', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;

    if (data.email === 'server-error@example.com') {
      return new HttpResponse(null, { status: 500 });
    }

    if (data.email === 'conflict-email@example.com') {
      return HttpResponse.json(
        { message: 'Этот email адрес уже зарегистрирован.' },
        { status: 409 }
      );
    }

    if (data.displayName === 'conflict-username') {
      return HttpResponse.json(
        { message: 'Имя пользователя уже занято.' },
        { status: 409 }
      );
    }

    if (data.password === 'weakpassword') {
      return HttpResponse.json(
        { message: 'Пароль слишком простой или короткий.' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      user: {
        ...userProfile,
        email: data.email as string || userProfile.email,
        displayName: data.displayName as string || userProfile.displayName
      }
    }, { status: 201 });
  }),

  http.post('*/api/v1/auth/refresh', async () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token-new',
      refreshToken: 'mock-refresh-token-new',
      tokenType: 'Bearer',
      user: userProfile
    });
  }),

  http.post('*/api/v1/auth/logout', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/api/v1/users/me', () => {
    return HttpResponse.json(userProfile);
  }),

  http.put('*/api/v1/users/me/ai-settings', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;
    userProfile.aiSettings = {
      provider: data.provider as SavedAiSettings['provider'],
      model: data.model as string || 'gemini-2.5-flash',
      apiKeyMasked: data.apiKey ? 'AIza...masked' : null,
      hasApiKey: !!data.apiKey,
      ollamaBaseUrl: data.ollamaBaseUrl as string || null,
      providerSettings: (data.providerSettings as Record<string, unknown>) || null
    };
    return HttpResponse.json(userProfile.aiSettings);
  }),

  http.get('*/api/v1/projects', () => {
    return HttpResponse.json({
      content: projectsList,
      totalElements: projectsList.length,
      totalPages: 1,
      page: 0
    });
  }),

  http.post('*/api/v1/projects', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;
    const newProjectId = `proj-${Date.now()}`;
    const techStack = data.techStack as Project['techStack'];

    const newProject: Project = {
      id: newProjectId,
      name: data.name as string,
      description: data.description as string || '',
      techStack: {
        backend: techStack?.backend || [],
        frontend: techStack?.frontend || [],
        other: techStack?.other || []
      },
      status: data.aiEstimate ? 'PENDING_AI' : 'ACTIVE',
      ownerId: '00000000-0000-0000-0000-000000000000',
      teamSize: data.teamSize as number || 1,
      aiEstimate: !!data.aiEstimate,
      totalEstimatedHours: data.aiEstimate ? 40 : 0,
      totalLoggedHours: 0,
      completionPercent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projectsList.unshift(newProject);

    projectGraphs[newProjectId] = {
      projectId: newProjectId,
      nodes: [
        {
          id: 'node-1',
          projectId: newProjectId,
          title: 'Инициализация проекта ИИ',
          description: `Декомпозиция проекта: ${newProject.description}`,
          status: 'AVAILABLE',
          category: 'DEVOPS',
          positionX: 100,
          positionY: 200,
          estimatedHours: 4,
          loggedHours: 0,
          enrichment: {
            checklist: ['Настроить окружение', 'Проверить линтер'],
            pitfalls: ['Начальная сборка может завершиться ошибкой при отсутствии node_modules'],
            links: []
          }
        }
      ],
      edges: [],
      enrichmentStatus: 'COMPLETED'
    };

    return HttpResponse.json({
      ...newProject,
      graph: projectGraphs[newProjectId]
    }, { status: 201 });
  }),

  http.get('*/api/v1/projects/:projectId', ({ params }) => {
    const { projectId } = params;
    const project = projectsList.find(p => p.id === projectId);

    if (!project) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(project);
  }),

  http.get('*/api/v1/projects/:projectId/graph', ({ params }) => {
    const { projectId } = params;
    const graph = projectGraphs[projectId as string];

    if (!graph) {
      return HttpResponse.json({
        projectId: projectId as string,
        nodes: [
          {
            id: 'node-empty',
            projectId: projectId as string,
            title: 'Начало разработки',
            description: 'Пожалуйста, создайте задачи или запустите ИИ-мутацию.',
            status: 'AVAILABLE',
            category: 'OTHER',
            positionX: 300,
            positionY: 200,
            estimatedHours: 1,
            loggedHours: 0,
            enrichment: {
              checklist: [],
              pitfalls: [],
              links: []
            }
          }
        ],
        edges: [],
        enrichmentStatus: 'COMPLETED'
      });
    }

    return HttpResponse.json(graph);
  })
];
