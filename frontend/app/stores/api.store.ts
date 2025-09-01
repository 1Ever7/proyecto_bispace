import { defineStore } from 'pinia';
import type { APIConfig, APIHealth } from '~/types/api';
import { apiClient } from '~/utils/api';

export const useApiStore = defineStore('api', {
  state: () => ({
    apis: [] as APIConfig[],
    healthStatus: {} as Record<string, APIHealth>,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async registerApi(apiConfig: APIConfig) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.registerAPI(apiConfig);
        if (response.success) {
          this.apis.push(apiConfig);
          return response;
        } else {
          throw new Error(response.error || 'Error al registrar API');
        }
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchAPIs() {
      this.loading = true;
      this.error = null;
      try {
        const apis = await apiClient.getAPIs();
        this.apis = apis;
        return apis;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchAPIHealth(apiId?: string) {
      this.loading = true;
      this.error = null;
      try {
        const healthData = await apiClient.getAPIHealth(apiId);
        
        if (apiId) {
          this.healthStatus[apiId] = healthData as APIHealth;
        } else {
          // Convert array to object keyed by API ID
          (healthData as APIHealth[]).forEach((health: APIHealth) => {
            this.healthStatus[health.id] = health;
          });
        }
        
        return healthData;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },

  getters: {
    getApiById: (state) => (id: string) => {
      return state.apis.find(api => api.id === id);
    },
    
    getApiHealth: (state) => (id: string) => {
      return state.healthStatus[id] || null;
    },
    
    healthyApis: (state) => {
      return state.apis.filter(api => 
        state.healthStatus[api.id]?.status === 'healthy'
      );
    },
    
    unhealthyApis: (state) => {
      return state.apis.filter(api => 
        state.healthStatus[api.id]?.status === 'unhealthy'
      );
    },
  },
});