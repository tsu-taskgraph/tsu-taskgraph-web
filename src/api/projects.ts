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

export const projectsApi = {
  async listProjects(params?: {
    status?: 'PENDING_AI' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    page?: number;
    size?: number;
  }): Promise<ProjectsListResponse> {
    const response = await apiClient.get<ProjectsListResponse>('/api/v1/projects', { params });
    return response.data;
  },

  async createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    const response = await apiClient.post<ProjectResponse>('/api/v1/projects', data);
    return response.data;
  }
};
