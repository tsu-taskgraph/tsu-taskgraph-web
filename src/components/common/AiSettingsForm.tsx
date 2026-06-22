import { useState, useEffect, useCallback } from 'react';
import {
    Loader2,
    Eye,
    EyeOff,
    Key,
    Cpu,
    Server,
    ExternalLink,
    Check,
    Save,
    ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { authApi, type SavedAiSettings } from '../../api/auth';
import { setAiSettings as persistAiSettings } from '../../api/client';
import { mapServerErrorToEnglish } from '../../api/errors';
import { useAuth } from '../../features/auth/context/AuthContext';
import {
    AI_PROVIDERS,
    getProviderInfo,
    type AiProviderType
} from '../../features/auth/aiProviders';

type Strategy = 'byok' | 'local';

interface AiSettingsFormProps {
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
    resetSignal: number;
}

export function AiSettingsForm({ onError, onSuccess, resetSignal }: AiSettingsFormProps) {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [strategy, setStrategy] = useState<Strategy>('byok');
    const [provider, setProvider] = useState<AiProviderType | null>(null);
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434');
    const [hasSavedKey, setHasSavedKey] = useState(false);
    const [maskedKey, setMaskedKey] = useState<string | null>(null);

    const [showApiKey, setShowApiKey] = useState(false);
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const settings = await authApi.getAiSettings();
            applySettings(settings);
        } catch (err) {
            if (user?.aiSettings) {
                applySettings(user.aiSettings);
            } else {
                const status = axios.isAxiosError(err) ? err.response?.status : undefined;
                const parsed = mapServerErrorToEnglish(err, status);
                onError(parsed.message);
            }
        } finally {
            setLoading(false);
        }
    }, [user?.aiSettings, onError]);

    function applySettings(settings: SavedAiSettings | null) {
        const p = settings?.provider ?? null;
        setProvider(p);
        setStrategy(p === 'ollama' ? 'local' : 'byok');
        setModel(settings?.model ?? getProviderInfo(p)?.defaultModel ?? '');
        setApiKey('');
        setHasSavedKey(settings?.hasApiKey ?? false);
        setMaskedKey(settings?.apiKeyMasked ?? null);
        setOllamaBaseUrl(settings?.ollamaBaseUrl ?? 'http://localhost:11434');
    }

    useEffect(() => {
        void loadSettings();
    }, [loadSettings, resetSignal]);

    useEffect(() => {
        if (!modelDropdownOpen) return;
        const close = () => setModelDropdownOpen(false);
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, [modelDropdownOpen]);

    const handleStrategyChange = (next: Strategy) => {
        setStrategy(next);
        if (next === 'local') {
            setProvider('ollama');
            setModel(getProviderInfo('ollama')!.defaultModel);
        } else {
            setProvider('gemini');
            setModel(getProviderInfo('gemini')!.defaultModel);
        }
        setApiKey('');
    };

    const handleProviderChange = (p: AiProviderType) => {
        setProvider(p);
        const info = getProviderInfo(p);
        setModel(info?.defaultModel ?? '');
        setApiKey('');
    };

    const providerInfo = getProviderInfo(provider);
    const availableModels = providerInfo?.models ?? [];

    const isDirty = (() => {
        if (provider !== (user?.aiSettings?.provider ?? null)) return true;
        if (model !== (user?.aiSettings?.model ?? '')) return true;
        if (apiKey.trim()) return true;
        if (provider === 'ollama' && ollamaBaseUrl !== (user?.aiSettings?.ollamaBaseUrl ?? 'http://localhost:11434')) return true;
        return false;
    })();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider) return;

        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                provider,
                model: model || providerInfo?.defaultModel || null,
            };

            if (apiKey.trim()) {
                payload.apiKey = apiKey.trim();
            }

            if (provider === 'ollama') {
                payload.ollamaBaseUrl = ollamaBaseUrl.trim() || null;
            }

            const updated = await authApi.updateAiSettings(payload);
            applySettings(updated);

            persistAiSettings({
                provider: provider,
                model: model || providerInfo?.defaultModel,
                apiKey: apiKey.trim() || undefined,
                ollamaBaseUrl: provider === 'ollama' ? ollamaBaseUrl.trim() : undefined
            });

            onSuccess('AI provider settings saved');
        } catch (err) {
            const status = axios.isAxiosError(err) ? err.response?.status : undefined;
            const parsed = mapServerErrorToEnglish(err, status);
            onError(parsed.message);
        } finally {
            setSaving(false);
        }
    };

    const byokProviders = AI_PROVIDERS.filter((p) => !p.isLocal);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-7 w-7 text-brand-500 animate-spin" />
                <span className="text-sm text-slate-400 light:text-slate-600 animate-pulse">Loading AI settings...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Connection Strategy</label>
                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        key="byok-btn"
                        type="button"
                        onClick={() => handleStrategyChange('byok')}
                        className={`relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${strategy === 'byok'
                            ? 'border-brand-500/50 bg-brand-500/10 shadow-md shadow-brand-500/10'
                            : 'border-white/10 bg-slate-900/40 hover:border-slate-700 light:border-slate-200 light:bg-white/60 light:hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${strategy === 'byok' ? 'bg-brand-500/20 text-brand-400 light:text-brand-600' : 'bg-slate-800/60 text-slate-400 light:bg-slate-100 light:text-slate-500'}`}>
                                <Key className="h-4 w-4" />
                            </div>
                            {strategy === 'byok' && <Check className="h-4 w-4 text-brand-400 light:text-brand-600" />}
                        </div>
                        <span className="text-sm font-bold text-slate-100 light:text-slate-900">BYOK</span>
                        <span className="text-[11px] text-slate-500 light:text-slate-600 leading-snug">Bring your own cloud API key (Gemini, OpenAI, Anthropic...)</span>
                    </button>

                    <button
                        key="local-btn"
                        type="button"
                        onClick={() => handleStrategyChange('local')}
                        className={`relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${strategy === 'local'
                            ? 'border-brand-500/50 bg-brand-500/10 shadow-md shadow-brand-500/10'
                            : 'border-white/10 bg-slate-900/40 hover:border-slate-700 light:border-slate-200 light:bg-white/60 light:hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${strategy === 'local' ? 'bg-brand-500/20 text-brand-400 light:text-brand-600' : 'bg-slate-800/60 text-slate-400 light:bg-slate-100 light:text-slate-500'}`}>
                                <Server className="h-4 w-4" />
                            </div>
                            {strategy === 'local' && <Check className="h-4 w-4 text-brand-400 light:text-brand-600" />}
                        </div>
                        <span className="text-sm font-bold text-slate-100 light:text-slate-900">Local</span>
                        <span className="text-[11px] text-slate-500 light:text-slate-600 leading-snug">Run models locally via Ollama — no API key needed</span>
                    </button>
                </div>
            </div>

            {strategy === 'byok' && (
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Provider</label>
                    <div className="grid grid-cols-2 gap-2">
                        {byokProviders.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handleProviderChange(p.id)}
                                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all cursor-pointer ${provider === p.id
                                    ? 'border-brand-500/50 bg-brand-500/10'
                                    : 'border-white/10 bg-slate-900/40 hover:border-slate-700 light:border-slate-200 light:bg-white/60 light:hover:border-slate-300'
                                    }`}
                            >
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.dotClass}`} />
                                <span className="text-sm font-semibold text-slate-200 light:text-slate-800 truncate">{p.label}</span>
                                {provider === p.id && <Check className="h-3.5 w-3.5 text-brand-400 light:text-brand-600 ml-auto shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {provider && (
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Model</label>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setModelDropdownOpen((v) => !v)}
                            className={`w-full flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition-all cursor-pointer ${modelDropdownOpen
                                ? 'border-brand-500 bg-slate-950 light:bg-white'
                                : 'border-slate-800 bg-slate-950 light:bg-slate-50 light:border-slate-200 hover:border-slate-700 light:hover:border-slate-300'
                                }`}
                        >
                            <span className="font-mono text-slate-100 light:text-slate-900 truncate">{model || 'Select model...'}</span>
                            <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {modelDropdownOpen && (
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-30 rounded-xl border border-white/10 bg-slate-900/95 light:bg-white/95 backdrop-blur-2xl shadow-xl overflow-hidden animate-dropdown-slide max-h-48 overflow-y-auto">
                                {availableModels.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => {
                                            setModel(m);
                                            setModelDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer ${m === model
                                            ? 'bg-brand-500/15 text-brand-400 light:text-brand-600'
                                            : 'text-slate-300 light:text-slate-700 hover:bg-white/5 light:hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="font-mono">{m}</span>
                                        {m === model && <Check className="h-3.5 w-3.5 shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {provider && !providerInfo?.isLocal && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Key className="h-3 w-3" />
                            API Key
                        </label>
                        <a
                            href={providerInfo?.keyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-medium text-brand-400 light:text-brand-600 hover:underline flex items-center gap-0.5 transition-colors"
                        >
                            Get key <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                    </div>

                    {hasSavedKey && !apiKey && (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-400 light:text-emerald-700 mb-0.5">
                            <Check className="h-3.5 w-3.5 shrink-0" />
                            <span>Key is set{maskedKey ? ` (${maskedKey})` : ''}. Type a new one below to replace it.</span>
                        </div>
                    )}

                    <div className="relative">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={hasSavedKey ? 'Enter new key to replace...' : 'Paste your API key...'}
                            autoComplete="off"
                            className="w-full bg-slate-950 light:bg-slate-50 light:focus:bg-white border border-slate-800 light:border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:outline-none transition-all duration-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey((v) => !v)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 light:hover:text-slate-700 transition-colors cursor-pointer"
                        >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            )}

            {providerInfo?.isLocal && (
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Server className="h-3 w-3" />
                        Ollama Base URL
                    </label>
                    <input
                        type="text"
                        value={ollamaBaseUrl}
                        onChange={(e) => setOllamaBaseUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        className="w-full bg-slate-950 light:bg-slate-50 light:focus:bg-white border border-slate-800 light:border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 focus:outline-none transition-all duration-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5">
                        Make sure Ollama is running and accessible from your browser. Default: http://localhost:11434
                    </span>
                </div>
            )}

            <button
                type="submit"
                disabled={!isDirty || saving || !provider}
                className="group relative h-10 px-5 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:pointer-events-none transition-all duration-300 cursor-pointer overflow-hidden shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 shrink-0 disabled:bg-gradient-to-r disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 light:disabled:from-slate-200 light:disabled:to-slate-200 light:disabled:text-slate-400 disabled:shadow-none"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-orange-600 transition-opacity duration-300 group-disabled:opacity-0" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-disabled:opacity-0" />
                {saving ? <Loader2 className="relative z-10 h-3.5 w-3.5 animate-spin" /> : <Save className="relative z-10 h-3.5 w-3.5" />}
                <span className="relative z-10">Save Settings</span>
            </button>

            <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-slate-900/30 light:bg-slate-50/50 p-3">
                <Cpu className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                    These settings are used for AI-powered features: task decomposition, graph mutation, and content enrichment. Your API key is encrypted (AES-256) and never exposed in plaintext.
                </p>
            </div>
        </form>
    );
}
