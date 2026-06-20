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

type MockTaskCategory = 'BACKEND' | 'FRONTEND' | 'DEVOPS' | 'TESTING' | 'DOCUMENTATION' | 'DESIGN' | 'OTHER' | null;

interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
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
    techStack: ['Java', 'Spring Boot', 'PostgreSQL', 'React', 'TypeScript', 'Tailwind CSS', 'Redis', 'Docker'],
    status: 'ACTIVE',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 3,
    aiEstimate: true,
    totalEstimatedHours: 39,
    totalLoggedHours: 8,
    completionPercent: 17,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
    name: 'Smart IoT Analytics Dashboard',
    description: 'Панель управления датчиками «умного дома» с real-time графиками и детекцией аномалий на базе ML.',
    techStack: ['Go', 'Python', 'ClickHouse', 'Next.js', 'TensorFlow', 'MQTT', 'Docker'],
    status: 'PENDING_AI',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 2,
    aiEstimate: true,
    totalEstimatedHours: 80,
    totalLoggedHours: 0,
    completionPercent: 0,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f',
    name: 'TaskGraph Wiki System',
    description: 'Внутренний сервис база знаний компании с поддержкой Markdown, версионированием и умным поиском.',
    techStack: ['Python', 'FastAPI', 'Elasticsearch', 'Vue.js', 'Tailwind CSS', 'SQLite'],
    status: 'COMPLETED',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 1,
    aiEstimate: false,
    totalEstimatedHours: 16,
    totalLoggedHours: 16,
    completionPercent: 100,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
    name: 'Old Corporate Website',
    description: 'Устаревший сайт-визитка компании с формой обратной связи и административной панелью управления контентом.',
    techStack: ['PHP', 'Laravel', 'MySQL', 'Bootstrap', 'jQuery'],
    status: 'ARCHIVED',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 1,
    aiEstimate: false,
    totalEstimatedHours: 24,
    totalLoggedHours: 24,
    completionPercent: 100,
    createdAt: new Date(Date.now() - 86400000 * 100).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 80).toISOString()
  },
  {
    id: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
    name: 'CRM System for Sales',
    description: 'Система управления взаимоотношениями с клиентами с воронкой продаж, интеграцией с телефонией и авто-отчетностью.',
    techStack: ['Node.js', 'Express', 'MongoDB', 'React', 'Tailwind CSS', 'WebSockets'],
    status: 'ACTIVE',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 4,
    aiEstimate: true,
    totalEstimatedHours: 120,
    totalLoggedHours: 45,
    completionPercent: 37,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
    name: 'Mobile Fitness Tracker App',
    description: 'Мобильное приложение для отслеживания тренировок, сна, потребления калорий с интеграцией с Apple Health.',
    techStack: ['React Native', 'TypeScript', 'Redux Toolkit', 'Node.js', 'GraphQL', 'PostgreSQL'],
    status: 'ACTIVE',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 3,
    aiEstimate: true,
    totalEstimatedHours: 90,
    totalLoggedHours: 30,
    completionPercent: 33,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
    name: 'AI-Powered Code Reviewer',
    description: 'Инструмент для автоматического анализа Pull Request с использованием LLM и генерацией отчетов об ошибках.',
    techStack: ['Python', 'FastAPI', 'PyTorch', 'LangChain', 'Docker', 'GitHub API'],
    status: 'ACTIVE',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 2,
    aiEstimate: true,
    totalEstimatedHours: 60,
    totalLoggedHours: 15,
    completionPercent: 25,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e',
    name: 'Distributed Cache Service',
    description: 'Высокопроизводительное распределенное хранилище кэша в памяти с поддержкой репликации и вытеснения LRU.',
    techStack: ['Rust', 'gRPC', 'Protobuf', 'Linux', 'Tokio'],
    status: 'ACTIVE',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 1,
    aiEstimate: false,
    totalEstimatedHours: 40,
    totalLoggedHours: 10,
    completionPercent: 25,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f',
    name: 'Analytical Data Pipeline',
    description: 'Конвейер сбора и обработки логов активности пользователей с последующей выгрузкой в Data Warehouse.',
    techStack: ['Scala', 'Apache Spark', 'Kafka', 'HDFS', 'Airflow', 'ClickHouse'],
    status: 'ACTIVE',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 2,
    aiEstimate: true,
    totalEstimatedHours: 100,
    totalLoggedHours: 20,
    completionPercent: 20,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d',
    name: 'E-Learning Platform API',
    description: 'RESTful API для образовательной платформы с курсами, лекциями, тестами и автоматической проверкой заданий.',
    techStack: ['Kotlin', 'Spring Boot', 'Spring Security', 'PostgreSQL', 'Liquibase', 'Redis'],
    status: 'ACTIVE',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 3,
    aiEstimate: true,
    totalEstimatedHours: 75,
    totalLoggedHours: 15,
    completionPercent: 20,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mock-workspace-project-error',
    name: 'Mock: Workspace Project Error',
    description: 'Технический мок для просмотра состояния ошибки при загрузке проекта на ProjectWorkspacePage.',
    techStack: ['MSW', 'Error State', 'ReactFlow'],
    status: 'ACTIVE',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 1,
    aiEstimate: false,
    totalEstimatedHours: 1,
    totalLoggedHours: 0,
    completionPercent: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mock-workspace-graph-error',
    name: 'Mock: Workspace Graph Error',
    description: 'Технический мок для просмотра состояния ошибки при загрузке графа задач на ProjectWorkspacePage.',
    techStack: ['MSW', 'Graph API', '500'],
    status: 'ACTIVE',
    ownerId: '00000000-0000-0000-0000-000000000000',
    teamSize: 1,
    aiEstimate: false,
    totalEstimatedHours: 1,
    totalLoggedHours: 0,
    completionPercent: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const projectGraphs: Record<string, {
  projectId: string;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  enrichmentStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}> = {
  '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e': {
    projectId: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
    nodes: [],
    edges: [],
    enrichmentStatus: 'PENDING'
  },
  '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f': {
    projectId: '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f',
    nodes: [],
    edges: [],
    enrichmentStatus: 'COMPLETED'
  },
  '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a': {
    projectId: '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
    nodes: [],
    edges: [],
    enrichmentStatus: 'COMPLETED'
  },
  '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b': {
    projectId: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
    nodes: [
      {
        id: 'crm-1',
        projectId: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
        title: 'Модель клиентов и сделок',
        description: 'Спроектировать сущности Customer, Lead, Deal и этапы воронки продаж.',
        status: 'COMPLETED',
        category: 'BACKEND',
        positionX: 80,
        positionY: 220,
        estimatedHours: 10,
        loggedHours: 10,
        enrichment: { checklist: ['Описать связи коллекций', 'Добавить индексы по email и статусу'], pitfalls: ['Не смешивать лиды и активных клиентов в одной сущности'], links: [] }
      },
      {
        id: 'crm-2',
        projectId: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
        title: 'REST API воронки продаж',
        description: 'CRUD для сделок, смена этапов, фильтры по менеджерам и сумме сделки.',
        status: 'IN_PROGRESS',
        category: 'BACKEND',
        positionX: 330,
        positionY: 100,
        estimatedHours: 18,
        loggedHours: 9,
        enrichment: { checklist: ['Создать контроллеры Express', 'Добавить валидацию DTO', 'Покрыть stage transitions тестами'], pitfalls: ['Проверить права доступа менеджеров к чужим сделкам'], links: [] }
      },
      {
        id: 'crm-3',
        projectId: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
        title: 'Kanban UI для сделок',
        description: 'Доска со стадиями продаж, drag-and-drop карточек и быстрым редактированием суммы.',
        status: 'AVAILABLE',
        category: 'FRONTEND',
        positionX: 330,
        positionY: 340,
        estimatedHours: 16,
        loggedHours: 2,
        enrichment: { checklist: ['Сверстать колонки', 'Подключить optimistic updates', 'Добавить skeleton состояния'], pitfalls: ['Не терять позицию карточки при ошибке API'], links: [] }
      },
      {
        id: 'crm-4',
        projectId: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
        title: 'WebSocket уведомления',
        description: 'События по новым лидам, изменению стадии сделки и назначению менеджера.',
        status: 'LOCKED',
        category: 'BACKEND',
        positionX: 600,
        positionY: 40,
        estimatedHours: 14,
        loggedHours: 0,
        enrichment: { checklist: ['Определить события домена', 'Настроить room per account'], pitfalls: ['Не отправлять персональные данные в общие комнаты'], links: [] }
      },
      {
        id: 'crm-5',
        projectId: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
        title: 'Интеграция телефонии',
        description: 'Импорт звонков, запись активностей и привязка контактов к клиентам.',
        status: 'LOCKED',
        category: 'BACKEND',
        positionX: 600,
        positionY: 220,
        estimatedHours: 20,
        loggedHours: 0,
        enrichment: { checklist: ['Согласовать формат webhook', 'Сделать retry обработчик'], pitfalls: ['Дедуплицировать повторные webhook события'], links: [] }
      },
      {
        id: 'crm-6',
        projectId: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
        title: 'Отчеты по продажам',
        description: 'Виджеты конверсии, прогноз выручки и экспорт CSV для руководителя.',
        status: 'AVAILABLE',
        category: 'FRONTEND',
        positionX: 600,
        positionY: 400,
        estimatedHours: 12,
        loggedHours: 3,
        enrichment: { checklist: ['Сделать график конверсии', 'Добавить экспорт CSV'], pitfalls: ['Сверить timezone при группировке по дням'], links: [] }
      },
      {
        id: 'crm-7',
        projectId: '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
        title: 'Legacy импорт XLS',
        description: 'Отложили ручной импорт старых Excel файлов в пользу API импорта из CRM источника.',
        status: 'SKIPPED',
        category: 'OTHER',
        positionX: 860,
        positionY: 330,
        estimatedHours: 8,
        loggedHours: 0,
        enrichment: { checklist: ['Зафиксировать решение', 'Удалить пункт из roadmap MVP'], pitfalls: ['Предупредить sales-команду о новом сценарии импорта'], links: [] }
      }
    ],
    edges: [
      { id: 'crm-e1', sourceTaskId: 'crm-1', targetTaskId: 'crm-2' },
      { id: 'crm-e2', sourceTaskId: 'crm-1', targetTaskId: 'crm-3' },
      { id: 'crm-e3', sourceTaskId: 'crm-2', targetTaskId: 'crm-4' },
      { id: 'crm-e4', sourceTaskId: 'crm-2', targetTaskId: 'crm-5' },
      { id: 'crm-e5', sourceTaskId: 'crm-3', targetTaskId: 'crm-6' },
      { id: 'crm-e6', sourceTaskId: 'crm-6', targetTaskId: 'crm-7' }
    ],
    enrichmentStatus: 'COMPLETED'
  },
  '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c': {
    projectId: '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
    nodes: [
      {
        id: 'fit-1',
        projectId: '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
        title: 'Дизайн навигации мобильного приложения',
        description: 'Определить tabs, onboarding и структуру экранов тренировок.',
        status: 'COMPLETED',
        category: 'DESIGN',
        positionX: 80,
        positionY: 180,
        estimatedHours: 8,
        loggedHours: 8,
        enrichment: { checklist: ['Согласовать IA', 'Подготовить состояния пустых экранов'], pitfalls: [], links: [] }
      },
      {
        id: 'fit-2',
        projectId: '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
        title: 'GraphQL схема тренировок',
        description: 'Схема Workout, Exercise, Set и мутации создания тренировок.',
        status: 'IN_PROGRESS',
        category: 'BACKEND',
        positionX: 330,
        positionY: 80,
        estimatedHours: 14,
        loggedHours: 7,
        enrichment: { checklist: ['Описать SDL', 'Добавить resolver permissions'], pitfalls: ['Не отдавать чужие тренировки по ID'], links: [] }
      },
      {
        id: 'fit-3',
        projectId: '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
        title: 'Экран дневника тренировок',
        description: 'Список тренировок, быстрый старт шаблонов и просмотр истории.',
        status: 'AVAILABLE',
        category: 'FRONTEND',
        positionX: 330,
        positionY: 280,
        estimatedHours: 12,
        loggedHours: 1,
        enrichment: { checklist: ['Сверстать список', 'Добавить pull-to-refresh'], pitfalls: ['Синхронизировать local cache после мутации'], links: [] }
      },
      {
        id: 'fit-4',
        projectId: '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
        title: 'Интеграция Apple Health',
        description: 'Чтение шагов, веса, сна и синхронизация разрешений пользователя.',
        status: 'LOCKED',
        category: 'BACKEND',
        positionX: 600,
        positionY: 80,
        estimatedHours: 18,
        loggedHours: 0,
        enrichment: { checklist: ['Запросить permissions', 'Сделать sync adapter'], pitfalls: ['Обработать отказ пользователя от доступа'], links: [] }
      },
      {
        id: 'fit-5',
        projectId: '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
        title: 'Тестирование offline режима',
        description: 'Проверить запись тренировок без сети и последующую синхронизацию.',
        status: 'LOCKED',
        category: 'TESTING',
        positionX: 600,
        positionY: 280,
        estimatedHours: 10,
        loggedHours: 0,
        enrichment: { checklist: ['Сценарии airplane mode', 'Конфликты повторной синхронизации'], pitfalls: ['Не перезаписывать новые серверные данные старыми локальными'], links: [] }
      }
    ],
    edges: [
      { id: 'fit-e1', sourceTaskId: 'fit-1', targetTaskId: 'fit-2' },
      { id: 'fit-e2', sourceTaskId: 'fit-1', targetTaskId: 'fit-3' },
      { id: 'fit-e3', sourceTaskId: 'fit-2', targetTaskId: 'fit-4' },
      { id: 'fit-e4', sourceTaskId: 'fit-3', targetTaskId: 'fit-5' },
      { id: 'fit-e5', sourceTaskId: 'fit-4', targetTaskId: 'fit-5' }
    ],
    enrichmentStatus: 'COMPLETED'
  },
  '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d': {
    projectId: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
    nodes: [],
    edges: [],
    enrichmentStatus: 'COMPLETED'
  },
  '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e': {
    projectId: '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e',
    nodes: [],
    edges: [],
    enrichmentStatus: 'COMPLETED'
  },
  '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f': {
    projectId: '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f',
    nodes: [],
    edges: [],
    enrichmentStatus: 'COMPLETED'
  },
  'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d': {
    projectId: 'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d',
    nodes: [],
    edges: [],
    enrichmentStatus: 'COMPLETED'
  },
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
      },
      {
        id: 't6',
        projectId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        title: 'Отказ от legacy-шаблона админки',
        description: 'Исключили отдельный Bootstrap-шаблон админ-панели, чтобы не плодить второй UI-контур и оставить управление внутри React workspace.',
        status: 'SKIPPED',
        category: 'DESIGN',
        positionX: 520,
        positionY: 360,
        estimatedHours: 3,
        loggedHours: 0,
        enrichment: {
          checklist: [
            'Зафиксировать решение в README проекта',
            'Удалить задачу из критического пути релиза',
            'Проверить, что навигация React покрывает административные сценарии'
          ],
          pitfalls: [
            'Не оставляйте мертвые роуты и ссылки на удаленный шаблон'
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
      { id: 'e5', sourceTaskId: 't4', targetTaskId: 't5' },
      { id: 'e6', sourceTaskId: 't3', targetTaskId: 't6' }
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

  http.patch('*/api/v1/users/me', async ({ request }) => {
    const data = await request.json() as { displayName: string };
    if (!data.displayName || data.displayName.trim() === '') {
      return HttpResponse.json(
        { message: 'Имя пользователя не может быть пустым.' },
        { status: 400 }
      );
    }
    userProfile.displayName = data.displayName;
    return HttpResponse.json(userProfile);
  }),

  http.post('*/api/v1/users/me/avatar', async ({ request }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return HttpResponse.json(
          { message: 'Файл аватара не предоставлен.' },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return HttpResponse.json(
          { message: 'Размер файла превышает лимит 5 MB.' },
          { status: 400 }
        );
      }

      if (!file.type.startsWith('image/')) {
        return HttpResponse.json(
          { message: 'Неподдерживаемый формат файла. Разрешены только изображения.' },
          { status: 400 }
        );
      }

      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      userProfile.avatarUrl = `data:${file.type};base64,${base64}`;

      return HttpResponse.json(userProfile);
    } catch (err) {
      console.error('Error processing avatar mock:', err);
      return HttpResponse.json(
        { message: 'Ошибка при обработке файла.' },
        { status: 500 }
      );
    }
  }),

  http.delete('*/api/v1/users/me/avatar', () => {
    userProfile.avatarUrl = null;
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

  http.get('*/api/v1/projects', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '12', 10);

    let filtered = [...projectsList];

    if (status && status !== 'ALL') {
      filtered = filtered.filter(p => p.status === status);
    }

    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const safePage = Math.min(page, totalPages - 1);
    const start = safePage * size;
    const content = filtered.slice(start, start + size);

    return HttpResponse.json({
      content,
      totalElements,
      totalPages,
      page: safePage
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
      techStack: Array.isArray(techStack) ? techStack : [],
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

    if (projectId === 'mock-workspace-project-error') {
      return HttpResponse.json(
        { message: 'Мок: ошибка загрузки проекта для проверки ProjectWorkspacePage.' },
        { status: 500 }
      );
    }

    const project = projectsList.find(p => p.id === projectId);

    if (!project) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(project);
  }),

  http.get('*/api/v1/projects/:projectId/graph', ({ params }) => {
    const { projectId } = params;

    if (projectId === 'mock-workspace-graph-error') {
      return HttpResponse.json(
        { message: 'Мок: ошибка загрузки графа задач для проверки ProjectWorkspacePage.' },
        { status: 500 }
      );
    }

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
            layer: 0,
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

    const nodeMap: Record<string, any> = {};
    (graph.nodes as any[]).forEach((node: any) => {
      nodeMap[node.id] = { ...node, layer: 0 };
    });

    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    (graph.nodes as any[]).forEach((node: any) => {
      adj[node.id] = [];
      inDegree[node.id] = 0;
    });

    (graph.edges as any[]).forEach((edge: any) => {
      const u = edge.sourceTaskId as string;
      const v = edge.targetTaskId as string;
      if (adj[u] && adj[v] !== undefined) {
        adj[u].push(v);
        inDegree[v] = (inDegree[v] || 0) + 1;
      }
    });

    const queue: { id: string; layer: number }[] = [];
    (graph.nodes as any[]).forEach((node: any) => {
      if (inDegree[node.id] === 0) {
        queue.push({ id: node.id as string, layer: 0 });
      }
    });

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const { id, layer } = current;
      nodeMap[id].layer = Math.max(nodeMap[id].layer || 0, layer);

      if (adj[id]) {
        adj[id].forEach((neighbor) => {
          inDegree[neighbor]--;
          queue.push({ id: neighbor, layer: layer + 1 });
        });
      }
    }

    const resolvedGraph = {
      ...graph,
      nodes: (graph.nodes as any[]).map((node: any) => nodeMap[node.id] || node)
    };

    return HttpResponse.json(resolvedGraph);
  }),

  http.post('*/api/v1/projects/:projectId/tasks', async ({ params, request }) => {
    const projectId = params.projectId as string;
    const project = projectsList.find(p => p.id === projectId);

    if (!project) {
      return new HttpResponse(null, { status: 404 });
    }

    const body = await request.json() as {
      title?: string;
      description?: string | null;
      category?: MockTaskCategory;
      estimatedHours?: number | null;
      startDate?: string | null;
      dueDate?: string | null;
      positionX?: number;
      positionY?: number;
    };

    if (!body.title?.trim()) {
      return HttpResponse.json({ message: 'Task title is required.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const positionX = Number.isFinite(body.positionX) ? Number(body.positionX) : 0;
    const positionY = Number.isFinite(body.positionY) ? Number(body.positionY) : 0;
    const graph = projectGraphs[projectId] ?? {
      projectId,
      nodes: [],
      edges: [],
      enrichmentStatus: 'COMPLETED' as const
    };

    const createdTask = {
      id: `manual-task-${Date.now()}`,
      projectId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      status: 'AVAILABLE' as const,
      category: body.category ?? 'OTHER',
      layer: Math.max(0, Math.round(positionX / 400)),
      positionX,
      positionY,
      assignees: [],
      enrichment: null,
      completionPercent: 0,
      estimatedHours: body.estimatedHours ?? null,
      loggedHours: 0,
      startDate: body.startDate ?? null,
      dueDate: body.dueDate ?? null,
      wikiPageId: null,
      createdAt: now,
      updatedAt: now
    };

    graph.nodes.push(createdTask);
    projectGraphs[projectId] = graph;
    project.totalEstimatedHours = (project.totalEstimatedHours ?? 0) + (createdTask.estimatedHours ?? 0);
    project.updatedAt = now;

    return HttpResponse.json(createdTask, { status: 201 });
  }),

  http.post('*/api/v1/projects/:projectId/edges', async ({ params, request }) => {
    const projectId = params.projectId as string;
    const graph = projectGraphs[projectId];

    if (!graph) {
      return new HttpResponse(null, { status: 404 });
    }

    const body = await request.json() as {
      sourceTaskId?: string;
      targetTaskId?: string;
    };

    const sourceTaskId = body.sourceTaskId;
    const targetTaskId = body.targetTaskId;

    if (!sourceTaskId || !targetTaskId) {
      return HttpResponse.json({ message: 'sourceTaskId and targetTaskId are required.' }, { status: 400 });
    }

    if (sourceTaskId === targetTaskId) {
      return HttpResponse.json({ message: 'Cannot create dependency: source and target task are the same.' }, { status: 400 });
    }

    const sourceExists = graph.nodes.some((node) => node.id === sourceTaskId);
    const targetExists = graph.nodes.some((node) => node.id === targetTaskId);

    if (!sourceExists || !targetExists) {
      return HttpResponse.json({ message: 'Cannot create dependency: task not found.' }, { status: 404 });
    }

    const targetTask = graph.nodes.find((node) => node.id === targetTaskId);
    if (targetTask?.status === 'COMPLETED') {
      return HttpResponse.json({ message: 'Cannot create dependency to a completed task.' }, { status: 400 });
    }

    const duplicate = graph.edges.some((edge) =>
      edge.sourceTaskId === sourceTaskId && edge.targetTaskId === targetTaskId
    );

    if (duplicate) {
      return HttpResponse.json({ message: 'Cannot create dependency: edge already exists.' }, { status: 409 });
    }

    const adjacency = new Map<string, string[]>();
    graph.nodes.forEach((node) => adjacency.set(node.id as string, []));
    graph.edges.forEach((edge) => {
      const source = edge.sourceTaskId as string;
      const target = edge.targetTaskId as string;
      adjacency.get(source)?.push(target);
    });

    const stack = [targetTaskId];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || visited.has(current)) continue;
      if (current === sourceTaskId) {
        return HttpResponse.json({ message: 'Cannot create dependency: cycle detected.' }, { status: 400 });
      }
      visited.add(current);
      stack.push(...(adjacency.get(current) ?? []));
    }

    const createdEdge = {
      id: `manual-edge-${Date.now()}`,
      sourceTaskId,
      targetTaskId
    };

    graph.edges.push(createdEdge);
    return HttpResponse.json(createdEdge, { status: 201 });
  })
];
