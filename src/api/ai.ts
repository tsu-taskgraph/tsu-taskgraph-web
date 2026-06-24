import { apiClient } from './client';
import type { AiProviderType } from '../features/auth/aiProviders';

export interface ProviderConfig {
    provider?: AiProviderType | string | null;
    apiKey?: string | null;
    model?: string | null;
    customBaseUrl?: string | null;
}

const isAiProviderType = (value: string): value is AiProviderType =>
    ['gemini', 'openai', 'anthropic', 'groq', 'mistral', 'ollama'].includes(value);

export const aiApi = {
    async getProviders(): Promise<AiProviderType[]> {
        const response = await apiClient.get<string[]>('/api/v1/providers');
        return (response.data ?? []).filter(isAiProviderType);
    },

    async getModels(config: ProviderConfig): Promise<string[]> {
        const response = await apiClient.post<string[]>('/api/v1/providers/models', config);
        return response.data ?? [];
    }
};
