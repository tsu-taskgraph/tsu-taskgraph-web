import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const getAccessToken = () => {
  try {
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem('refreshToken');
  } catch {
    return null;
  }
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  try {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  } catch (e) {
    console.warn('localStorage is disabled:', e);
  }
};

export const clearTokens = () => {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  } catch (e) {
    console.warn('localStorage is disabled:', e);
  }
};

export const getAiSettings = () => {
  try {
    const settings = localStorage.getItem('aiSettings');
    return settings ? JSON.parse(settings) : null;
  } catch {
    return null;
  }
};

export const setAiSettings = (settings: {
  provider?: string;
  apiKey?: string;
  model?: string;
  ollamaBaseUrl?: string;
}) => {
  try {
    localStorage.setItem('aiSettings', JSON.stringify(settings));
  } catch (e) {
    console.warn('localStorage is disabled:', e);
  }
};


apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const aiSettings = getAiSettings();
    if (aiSettings) {
      if (aiSettings.provider) config.headers['X-AI-Provider'] = aiSettings.provider;
      if (aiSettings.apiKey) config.headers['X-AI-API-Key'] = aiSettings.apiKey;
      if (aiSettings.model) config.headers['X-AI-Model'] = aiSettings.model;
      if (aiSettings.ollamaBaseUrl) config.headers['X-Ollama-Base-URL'] = aiSettings.ollamaBaseUrl;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url?.includes('/api/v1/auth/refresh')) {
      clearTokens();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        clearTokens();

        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        setTokens(newAccessToken, newRefreshToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
