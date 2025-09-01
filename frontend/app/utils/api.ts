import type { ChatRequest, ChatResponse, APIConfig, APIHealth } from '~/types/api';
import { $fetch } from 'ohmyfetch';

// Función para obtener la URL base dinámicamente
function getApiBaseUrl() {
  const config = useRuntimeConfig();
  return config.public.apiBase2;
}

export const apiClient = {
  // Chat endpoints
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const API_BASE_URL = getApiBaseUrl();
    const response = await $fetch('/api/chat/message', {
      baseURL: API_BASE_URL,
      method: 'POST',
      body: request,
    });
    return response.data;
  },

  // API management endpoints
  async registerAPI(apiConfig: APIConfig): Promise<any> {
    const API_BASE_URL = getApiBaseUrl();
    const response = await $fetch('/api/register', {
      baseURL: API_BASE_URL,
      method: 'POST',
      body: apiConfig,
    });
    return response;
  },

  async getAPIs(): Promise<APIConfig[]> {
    const API_BASE_URL = getApiBaseUrl();
    const response = await $fetch('/api', {
      baseURL: API_BASE_URL,
    });
    return response.data;
  },

  async getAPIHealth(apiId?: string): Promise<APIHealth | APIHealth[]> {
    const API_BASE_URL = getApiBaseUrl();
    const endpoint = apiId ? `/api/health/${apiId}` : '/api/health';
    const response = await $fetch(endpoint, {
      baseURL: API_BASE_URL,
    });
    return response.data;
  },
};
