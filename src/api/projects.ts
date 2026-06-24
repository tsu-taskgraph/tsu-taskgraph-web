import { apiClient, resolveApiAssetUrl } from './client';

export type TechStack = string[];
export type HoursInput = string | number | null;

export interface ProjectMember {
  id?: string;
  projectId?: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
}

export interface ProjectResponse {
  id: string;
  version?: number;
  name: string;
  description: string;
  techStack: TechStack;
  status: 'PENDING_AI' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  ownerId: string;
  teamSize: number;
  aiEstimate: boolean;
  totalEstimatedHours: number | null;
  totalLoggedHours: number | null;
  completionPercent: number;
  members?: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  techStack: TechStack;
  description: string;
  teamSize?: number;
  aiEstimate?: boolean;
}

export interface ProjectsListResponse {
  content: ProjectResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
  number?: number;
  size?: number;
}

export interface TaskEnrichment {
  checklist: string[];
  pitfalls: string[];
  links: { title: string; url: string }[];
  rawMarkdown: string;
}

export interface TaskNode {
  id: string;
  version?: number;
  projectId: string;
  title: string;
  description: string | null;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  category: 'BACKEND' | 'FRONTEND' | 'DEVOPS' | 'TESTING' | 'DOCUMENTATION' | 'DESIGN' | 'OTHER' | null;
  layer: number;
  positionX: number;
  positionY: number;
  assignees: {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
  }[];
  enrichment: TaskEnrichment | null;
  completionPercent: number;
  estimatedHours: number | null;
  loggedHours: number;
  startDate: string | null;
  dueDate: string | null;
  wikiPageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EdgeResponse {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
}

export interface ProjectGraphResponse {
  projectId: string;
  nodes: TaskNode[];
  edges: EdgeResponse[];
  enrichmentStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}


export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  category?: TaskNode['category'];
  estimatedHours?: HoursInput;
  startDate?: string | null;
  dueDate?: string | null;
  positionX: number;
  positionY: number;
}

export interface CreateEdgeRequest {
  sourceTaskId: string;
  targetTaskId: string;
}

export interface MutateGraphRequest {
  prompt: string;
}

export interface InviteMemberRequest {
  email: string;
  role: ProjectMember['role'];
}

export interface UpdateMemberRoleRequest {
  role: ProjectMember['role'];
}

export interface UpdateTaskRequest {
  version?: number;
  title?: string;
  description?: string | null;
  category?: TaskNode['category'];
  estimatedHours?: HoursInput;
  completionPercent?: number | null;
  startDate?: string | null;
  dueDate?: string | null;
  positionX?: number;
  positionY?: number;
}

export interface TimeLogResponse {
  id: string;
  taskId: string;
  userId: string;
  userDisplayName: string;
  hours: number;
  comment: string | null;
  loggedAt: string;
}

export interface AssignTaskRequest {
  userIds: string[];
}

export type ActionLogActorType = 'USER' | 'AI' | 'SYSTEM';

export type ActionLogEventType =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'MEMBER_INVITED'
  | 'MEMBER_ROLE_CHANGED'
  | 'MEMBER_REMOVED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_UNASSIGNED'
  | 'TASK_DELETED'
  | 'TIME_LOGGED'
  | 'EDGE_CREATED'
  | 'EDGE_DELETED'
  | 'GRAPH_MUTATED'
  | 'SMART_RECOVERY_APPLIED'
  | 'AI_SKELETON_GENERATED'
  | 'AI_ENRICHMENT_COMPLETED'
  | 'AI_ENRICHMENT_FAILED'
  | 'WIKI_PAGE_CREATED'
  | 'WIKI_PAGE_UPDATED'
  | 'BLUEPRINT_GENERATED'
  | 'GITHUB_TASK_CLOSED'
  | (string & {});

export interface ActionLogEntry {
  id: string;
  projectId: string;
  actorId: string | null;
  actorType: ActionLogActorType;
  actorDisplayName: string;
  eventType: ActionLogEventType;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActionLogResponse {
  content: ActionLogEntry[];
  totalElements: number;
  totalPages: number;
  page?: number;
  number?: number;
}

const normalizeTaskNode = (task: TaskNode): TaskNode => ({
  ...task,
  assignees: (task.assignees ?? []).map((assignee) => ({
    ...assignee,
    avatarUrl: resolveApiAssetUrl(assignee.avatarUrl)
  }))
});

const normalizeProject = (project: ProjectResponse): ProjectResponse => ({
  ...project,
  members: (project.members ?? []).map(normalizeProjectMember)
});

const normalizeProjectPage = (page: ProjectsListResponse): ProjectsListResponse => ({
  ...page,
  page: page.page ?? page.number ?? 0,
  content: (page.content ?? []).map(normalizeProject)
});

const normalizeProjectGraph = (graph: ProjectGraphResponse): ProjectGraphResponse => ({
  ...graph,
  nodes: (graph.nodes ?? []).map(normalizeTaskNode),
  edges: graph.edges ?? []
});

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const readString = (value: unknown): string | undefined => (
  typeof value === 'string' && value.trim() ? value : undefined
);

const readNumber = (value: unknown): number | undefined => (
  typeof value === 'number' && Number.isFinite(value) ? value : undefined
);

const normalizeActionLogActorType = (value: unknown): ActionLogActorType => {
  if (value === 'USER' || value === 'AI' || value === 'SYSTEM') return value;
  return 'SYSTEM';
};

const getFallbackActorDisplayName = (actorType: ActionLogActorType): string => {
  if (actorType === 'AI') return 'TaskGraph AI';
  if (actorType === 'SYSTEM') return 'System';
  return 'Unknown user';
};

const normalizeActionLogEntry = (entry: unknown): ActionLogEntry => {
  const raw = isRecord(entry) ? entry : {};
  const metadata = isRecord(raw.metadata) ? raw.metadata : null;
  const actorType = normalizeActionLogActorType(raw.actorType);
  const description = readString(raw.description) ?? 'Project activity updated.';
  const createdAt = readString(raw.createdAt) ?? new Date().toISOString();

  return {
    id: readString(raw.id) ?? `${createdAt}-${description}`,
    projectId: readString(raw.projectId) ?? '',
    actorId: readString(raw.actorId) ?? readString(metadata?.actorId) ?? null,
    actorType,
    actorDisplayName:
      readString(raw.actorDisplayName) ??
      readString(raw.actorName) ??
      readString(raw.userDisplayName) ??
      readString(metadata?.actorDisplayName) ??
      getFallbackActorDisplayName(actorType),
    eventType: readString(raw.eventType) ?? 'PROJECT_UPDATED',
    description,
    metadata,
    createdAt
  };
};

const normalizeActionLogResponse = (data: unknown): ActionLogResponse => {
  if (Array.isArray(data)) {
    const content = data.map(normalizeActionLogEntry);
    return {
      content,
      totalElements: content.length,
      totalPages: 1,
      page: 0,
      number: 0
    };
  }

  const raw = isRecord(data) ? data : {};
  const content = Array.isArray(raw.content) ? raw.content.map(normalizeActionLogEntry) : [];
  const page = readNumber(raw.page) ?? readNumber(raw.number) ?? 0;

  return {
    content,
    totalElements: readNumber(raw.totalElements) ?? content.length,
    totalPages: readNumber(raw.totalPages) ?? (content.length > 0 ? 1 : 0),
    page,
    number: readNumber(raw.number) ?? page
  };
};

const normalizeProjectMember = (member: Partial<ProjectMember> & { userId?: string; id?: string }): ProjectMember => {
  const userId = member.userId ?? member.id ?? '';
  return {
    ...member,
    userId,
    displayName: member.displayName ?? (userId ? `User ${userId.slice(0, 8)}` : 'Project member'),
    email: member.email ?? '',
    avatarUrl: resolveApiAssetUrl(member.avatarUrl),
    role: member.role ?? 'MEMBER',
    joinedAt: member.joinedAt ?? ''
  };
};

const serializeHours = (value: HoursInput | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  return value.trim().replace(',', '.');
};

const serializeCreateTaskRequest = (data: CreateTaskRequest): CreateTaskRequest => ({
  ...data,
  estimatedHours: serializeHours(data.estimatedHours)
});

const serializeUpdateTaskRequest = (data: UpdateTaskRequest): UpdateTaskRequest => ({
  ...data,
  estimatedHours: serializeHours(data.estimatedHours)
});

export interface UpdateProjectRequest {
  version: number;
  name?: string;
  description?: string | null;
  techStack?: TechStack;
  status?: ProjectResponse['status'];
  aiEstimate?: boolean;
}

export const projectsApi = {
  async listProjects(params?: {
    status?: 'PENDING_AI' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    name?: string;
    page?: number;
    size?: number;
  }): Promise<ProjectsListResponse> {
    const response = await apiClient.get<ProjectsListResponse>('/api/v1/projects', { params });
    return normalizeProjectPage(response.data);
  },

  async createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    const response = await apiClient.post<ProjectResponse>('/api/v1/projects', data, {
      timeout: 20000
    });
    return normalizeProject(response.data);
  },

  async getProject(projectId: string): Promise<ProjectResponse> {
    const response = await apiClient.get<ProjectResponse>(`/api/v1/projects/${projectId}`);
    return normalizeProject(response.data);
  },

  async updateProject(projectId: string, data: UpdateProjectRequest): Promise<ProjectResponse> {
    const response = await apiClient.patch<ProjectResponse>(`/api/v1/projects/${projectId}`, data);
    return normalizeProject(response.data);
  },

  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/api/v1/projects/${projectId}`);
  },

  async getProjectGraph(projectId: string): Promise<ProjectGraphResponse> {
    const response = await apiClient.get<ProjectGraphResponse>(`/api/v1/projects/${projectId}/graph`);
    return normalizeProjectGraph(response.data);
  },

  async createTask(projectId: string, data: CreateTaskRequest): Promise<TaskNode> {
    const response = await apiClient.post<TaskNode>(`/api/v1/projects/${projectId}/tasks`, serializeCreateTaskRequest(data));
    return normalizeTaskNode(response.data);
  },

  async createEdge(projectId: string, data: CreateEdgeRequest, enableSmartRecovery = false): Promise<EdgeResponse> {
    const response = await apiClient.post<EdgeResponse>(`/api/v1/projects/${projectId}/edges`, data, {
      headers: {
        'X-Enable-Smart-Recovery': String(enableSmartRecovery)
      }
    });
    return response.data;
  },

  async mutateGraph(projectId: string, data: MutateGraphRequest): Promise<ProjectGraphResponse> {
    const response = await apiClient.post<ProjectGraphResponse>(`/api/v1/projects/${projectId}/mutate`, data);
    return normalizeProjectGraph(response.data);
  },

  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<TaskNode> {
    const response = await apiClient.patch<TaskNode>(`/api/v1/tasks/${taskId}`, serializeUpdateTaskRequest(data));
    return normalizeTaskNode(response.data);
  },

  async logTaskTime(taskId: string, data: { hours: HoursInput; comment?: string | null }): Promise<TimeLogResponse> {
    const response = await apiClient.post<TimeLogResponse>(`/api/v1/tasks/${taskId}/time-logs`, {
      ...data,
      hours: serializeHours(data.hours)
    });
    return response.data;
  },

  async listTaskTimeLogs(taskId: string): Promise<TimeLogResponse[]> {
    const response = await apiClient.get<TimeLogResponse[]>(`/api/v1/tasks/${taskId}/time-logs`);
    return response.data;
  },

  async deleteTimeLog(taskId: string, logId: string): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${taskId}/time-logs/${logId}`);
  },

  async updateTaskStatus(
    taskId: string,
    data: {
      status: 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
      loggedHours: HoursInput;
      comment?: string | null;
    }
  ): Promise<{ updatedTask: TaskNode; unlockedTasks: TaskNode[]; graph?: ProjectGraphResponse }> {
    const response = await apiClient.patch<{ updatedTask: TaskNode; unlockedTasks: TaskNode[]; graph?: ProjectGraphResponse }>(
      `/api/v1/tasks/${taskId}/status`,
      {
        ...data,
        loggedHours: serializeHours(data.loggedHours)
      }
    );
    return {
      ...response.data,
      updatedTask: normalizeTaskNode(response.data.updatedTask),
      unlockedTasks: (response.data.unlockedTasks ?? []).map(normalizeTaskNode),
      graph: response.data.graph ? normalizeProjectGraph(response.data.graph) : undefined
    };
  },

  async deleteEdge(edgeId: string): Promise<void> {
    await apiClient.delete(`/api/v1/edges/${edgeId}`);
  },

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${taskId}`);
  },

  async listProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await apiClient.get<ProjectMember[]>(`/api/v1/projects/${projectId}/members`);
    return (response.data ?? []).map(normalizeProjectMember);
  },

  async inviteMember(projectId: string, data: InviteMemberRequest): Promise<ProjectMember> {
    const response = await apiClient.post<ProjectMember>(`/api/v1/projects/${projectId}/members`, data);
    return normalizeProjectMember(response.data);
  },

  async updateMemberRole(projectId: string, userId: string, data: UpdateMemberRoleRequest): Promise<ProjectMember> {
    const response = await apiClient.patch<ProjectMember>(`/api/v1/projects/${projectId}/members/${userId}`, data);
    return normalizeProjectMember(response.data);
  },

  async removeMember(projectId: string, userId: string): Promise<void> {
    await apiClient.delete(`/api/v1/projects/${projectId}/members/${userId}`);
  },

  async assignTask(taskId: string, data: AssignTaskRequest): Promise<TaskNode> {
    const response = await apiClient.put<TaskNode>(`/api/v1/tasks/${taskId}/assignees`, data);
    return normalizeTaskNode(response.data);
  },

  async getActionLog(
    projectId: string,
    params?: {
      actorType?: ActionLogActorType;
      eventType?: ActionLogEventType;
      page?: number;
      size?: number;
    }
  ): Promise<ActionLogResponse> {
    const response = await apiClient.get<unknown>(`/api/v1/projects/${projectId}/action-log`, { params });
    return normalizeActionLogResponse(response.data);
  }
};
