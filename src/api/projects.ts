import { apiClient } from './client';

export type TechStack = string[];

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
  estimatedHours?: number | null;
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
  estimatedHours?: number | null;
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
  | 'WIKI_PAGE_CREATED'
  | 'WIKI_PAGE_UPDATED'
  | 'BLUEPRINT_GENERATED'
  | 'GITHUB_TASK_CLOSED';

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

const normalizeProject = (project: ProjectResponse): ProjectResponse => ({
  ...project,
  members: project.members ?? []
});

const normalizeProjectPage = (page: ProjectsListResponse): ProjectsListResponse => ({
  ...page,
  page: page.page ?? page.number ?? 0,
  content: (page.content ?? []).map(normalizeProject)
});

const normalizeProjectMember = (member: Partial<ProjectMember> & { userId?: string; id?: string }): ProjectMember => {
  const userId = member.userId ?? member.id ?? '';
  return {
    ...member,
    userId,
    displayName: member.displayName ?? (userId ? `User ${userId.slice(0, 8)}` : 'Project member'),
    email: member.email ?? '',
    avatarUrl: member.avatarUrl ?? null,
    role: member.role ?? 'MEMBER',
    joinedAt: member.joinedAt ?? ''
  };
};

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

  async getProjectGraph(projectId: string): Promise<ProjectGraphResponse> {
    const response = await apiClient.get<ProjectGraphResponse>(`/api/v1/projects/${projectId}/graph`);
    return response.data;
  },

  async createTask(projectId: string, data: CreateTaskRequest): Promise<TaskNode> {
    const response = await apiClient.post<TaskNode>(`/api/v1/projects/${projectId}/tasks`, data);
    return response.data;
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
    return response.data;
  },

  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<TaskNode> {
    const response = await apiClient.patch<TaskNode>(`/api/v1/tasks/${taskId}`, data);
    return response.data;
  },

  async logTaskTime(taskId: string, data: { hours: number; comment?: string | null }): Promise<TimeLogResponse> {
    const response = await apiClient.post<TimeLogResponse>(`/api/v1/tasks/${taskId}/time-logs`, data);
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
      loggedHours: number | null;
      comment?: string | null;
    }
  ): Promise<{ updatedTask: TaskNode; unlockedTasks: TaskNode[] }> {
    const response = await apiClient.patch<{ updatedTask: TaskNode; unlockedTasks: TaskNode[] }>(
      `/api/v1/tasks/${taskId}/status`,
      data
    );
    return response.data;
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
    return response.data;
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
    const response = await apiClient.get<ActionLogResponse>(`/api/v1/projects/${projectId}/action-log`, { params });
    return response.data;
  }
};