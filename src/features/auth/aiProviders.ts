export type AiProviderType = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'mistral' | 'ollama';

export interface AiProviderInfo {
    id: AiProviderType;
    label: string;
    isLocal: boolean;
    defaultModel: string;
    models: string[];
    keyUrl: string;
    badgeClass: string;
    dotClass: string;
}

export const AI_PROVIDERS: AiProviderInfo[] = [
    {
        id: 'gemini',
        label: 'Google Gemini',
        isLocal: false,
        defaultModel: 'gemini-2.5-flash',
        models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
        keyUrl: 'https://aistudio.google.com/apikey',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/25 light:bg-blue-500/15 light:text-blue-700 light:border-blue-500/30',
        dotClass: 'bg-blue-400'
    },
    {
        id: 'openai',
        label: 'OpenAI',
        isLocal: false,
        defaultModel: 'gpt-4o',
        models: ['gpt-4o', 'gpt-4o-mini', 'o4-mini', 'o3-mini', 'o3'],
        keyUrl: 'https://platform.openai.com/api-keys',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 light:bg-emerald-500/15 light:text-emerald-700 light:border-emerald-500/30',
        dotClass: 'bg-emerald-400'
    },
    {
        id: 'anthropic',
        label: 'Anthropic',
        isLocal: false,
        defaultModel: 'claude-sonnet-4-6',
        models: ['claude-sonnet-4-6', 'claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest'],
        keyUrl: 'https://console.anthropic.com/settings/keys',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25 light:bg-amber-500/15 light:text-amber-700 light:border-amber-500/30',
        dotClass: 'bg-amber-400'
    },
    {
        id: 'groq',
        label: 'Groq',
        isLocal: false,
        defaultModel: 'llama-3.3-70b-versatile',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
        keyUrl: 'https://console.groq.com/keys',
        badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/25 light:bg-orange-500/15 light:text-orange-700 light:border-orange-500/30',
        dotClass: 'bg-orange-400'
    },
    {
        id: 'mistral',
        label: 'Mistral AI',
        isLocal: false,
        defaultModel: 'mistral-large-latest',
        models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
        keyUrl: 'https://console.mistral.ai/api-keys',
        badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/25 light:bg-violet-500/15 light:text-violet-700 light:border-violet-500/30',
        dotClass: 'bg-violet-400'
    },
    {
        id: 'ollama',
        label: 'Ollama (Local)',
        isLocal: true,
        defaultModel: 'llama3',
        models: ['llama3', 'llama3.1', 'qwen2.5', 'phi3', 'gemma2'],
        keyUrl: 'https://ollama.com/download',
        badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/25 light:bg-slate-100 light:text-slate-600 light:border-slate-200',
        dotClass: 'bg-slate-400'
    }
];

const PROVIDER_MAP = new Map(AI_PROVIDERS.map((p) => [p.id, p]));

export function getProviderInfo(id: AiProviderType | null | undefined): AiProviderInfo | undefined {
    if (!id) return undefined;
    return PROVIDER_MAP.get(id);
}

export function getProviderModels(id: AiProviderType | null | undefined): string[] {
    return getProviderInfo(id)?.models ?? [];
}
