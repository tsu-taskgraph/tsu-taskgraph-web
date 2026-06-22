import { apiClient, setTokens, clearTokens, resolveApiAssetUrl } from './client';
import type { AiProviderType } from '../features/auth/aiProviders';

export interface SavedAiSettings {
  provider: AiProviderType | null;
  model: string | null;
  apiKeyMasked: string | null;
  hasApiKey: boolean;
  customBaseUrl: string | null;
  ollamaBaseUrl?: string | null;
  providerSettings?: Record<string, unknown> | null;
}

export interface UpdateAiSettingsRequest {
  provider?: AiProviderType;
  model?: string | null;
  apiKey?: string | null;
  customBaseUrl?: string | null;
  ollamaBaseUrl?: string | null;
  providerSettings?: Record<string, unknown> | null;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  aiSettings: SavedAiSettings | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  user: UserProfile;
}

const normalizeUserProfile = (user: UserProfile): UserProfile => ({
  ...user,
  avatarUrl: resolveApiAssetUrl(user.avatarUrl)
});

const normalizeAuthResponse = (data: AuthResponse): AuthResponse => ({
  ...data,
  user: normalizeUserProfile(data.user)
});

export const authApi = {
  async register(data: Record<string, unknown>): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', data);
    const authData = normalizeAuthResponse(response.data);
    setTokens(authData.accessToken, authData.refreshToken);
    return authData;
  },

  async login(data: Record<string, unknown>): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
    const authData = normalizeAuthResponse(response.data);
    setTokens(authData.accessToken, authData.refreshToken);
    return authData;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await apiClient.post('/api/v1/auth/logout', { refreshToken });
      }
    } finally {
      clearTokens();
    }
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/api/v1/users/me');
    return normalizeUserProfile(response.data);
  },

  async updateProfile(data: { displayName: string }): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>('/api/v1/users/me', data);
    return normalizeUserProfile(response.data);
  },

  async getAiSettings(): Promise<SavedAiSettings> {
    const response = await apiClient.get<SavedAiSettings>('/api/v1/users/me/ai-settings');
    return response.data;
  },

  async updateAiSettings(data: UpdateAiSettingsRequest): Promise<SavedAiSettings> {
    const response = await apiClient.put<SavedAiSettings>('/api/v1/users/me/ai-settings', data);
    return response.data;
  },

  async uploadAvatar(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<UserProfile>('/api/v1/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return normalizeUserProfile(response.data);
  },

  async deleteAvatar(): Promise<UserProfile> {
    const response = await apiClient.delete<UserProfile>('/api/v1/users/me/avatar');
    return normalizeUserProfile(response.data);
  },
};