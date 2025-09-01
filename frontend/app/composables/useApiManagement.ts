import type { APIConfig } from '~/types/api';
import { useApiStore } from '~/stores/api.store';
import { computed } from 'vue';

export const useToast = () => ({
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg),
  warning: (msg: string) => console.warn('⚠️', msg),
});

export const useApiManagement = () => {
  const apiStore = useApiStore();
  const toast = useToast();

  const registerNewApi = async (apiConfig: APIConfig) => {
    try {
      const response = await apiStore.registerApi(apiConfig);
      toast.success('API registrada exitosamente');
      return response;
    } catch (error: any) {
      toast.error(`Error al registrar API: ${error.message}`);
      throw error;
    }
  };

  const loadAllApis = async () => {
    try {
      await apiStore.fetchAPIs();
    } catch (error: any) {
      toast.error(`Error al cargar APIs: ${error.message}`);
      throw error;
    }
  };

  const checkApiHealth = async (apiId?: string) => {
    try {
      await apiStore.fetchAPIHealth(apiId);
      
      if (apiId) {
        const health = apiStore.getApiHealth(apiId);
        if (health?.status === 'healthy') {
          toast.success(`API ${apiId} está funcionando correctamente`);
        } else {
          toast.warning(`API ${apiId} tiene problemas: ${health?.error}`);
        }
      } else {
        toast.success('Estado de salud de todas las APIs verificado');
      }
    } catch (error: any) {
      toast.error(`Error al verificar salud de API: ${error.message}`);
      throw error;
    }
  };

  return {
    registerNewApi,
    loadAllApis,
    checkApiHealth,
    apis: computed(() => apiStore.apis),
    healthStatus: computed(() => apiStore.healthStatus),
    loading: computed(() => apiStore.loading),
  };
};