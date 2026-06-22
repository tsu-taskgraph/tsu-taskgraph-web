import { apiClient } from './client';

export type TechStack = string[];

export interface ProjectMember {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
}

export interface ProjectResponse {
  id: string;
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
  members: ProjectMember[];
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
}

export interface TaskEnrichment {
  checklist: string[];
  pitfalls: string[];
  links: { title: string; url: string }[];
  rawMarkdown: string;
}

export interface TaskNode {
  id: string;
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

export interface CreateProjectResponse extends ProjectResponse {
  graph: ProjectGraphResponse;
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

export interface UpdateTaskRequest {
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
  hours: number;
  comment: string | null;
  loggedAt: string;
}

export const projectsApi = {
  async listProjects(params?: {
    status?: 'PENDING_AI' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    page?: number;
    size?: number;
  }): Promise<ProjectsListResponse> {
    const response = await apiClient.get<ProjectsListResponse>('/api/v1/projects', { params });
    return response.data;
  },

  async createProject(data: CreateProjectRequest): Promise<CreateProjectResponse> {
    const response = await apiClient.post<CreateProjectResponse>('/api/v1/projects', data, {
      timeout: 20000
    });
    return response.data;
  },

  async getProject(projectId: string): Promise<ProjectResponse> {
    const response = await apiClient.get<ProjectResponse>(`/api/v1/projects/${projectId}`);
    return response.data;
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

  async deleteEdge(edgeId: string): Promise<ProjectGraphResponse> {
    const response = await apiClient.delete<ProjectGraphResponse>(`/api/v1/edges/${edgeId}`);
    return response.data;
  },

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${taskId}`);
  }
};
