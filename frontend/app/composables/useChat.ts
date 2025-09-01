import type { ChatRequest, ChatResponse } from '~/types/api';
import { apiClient } from '~/utils/api';

export const useChat = () => {
  const messages = ref<Array<{ role: string; content: string }>>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedModel = ref<'gemini' | 'claude'>('claude');
  const selectedApi = ref<string | null>(null);

  const sendMessage = async (message: string) => {
    loading.value = true;
    error.value = null;
    
    // Agregar mensaje del usuario al historial
    messages.value.push({ role: 'user', content: message });
    
    try {
      const request: ChatRequest = {
        message,
        model: selectedModel.value,
        apiId: selectedApi.value || undefined
      };
      
      const response = await apiClient.sendMessage(request);
      
      // Agregar respuesta del asistente al historial
      messages.value.push({ role: 'assistant', content: response.response });
      
      return response;
    } catch (err: any) {
      error.value = err.message || 'Error al enviar el mensaje';
      
      // Agregar mensaje de error al historial
      messages.value.push({ 
        role: 'assistant', 
        content: `Lo siento, ha ocurrido un error: ${error.value}` 
      });
      
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearMessages = () => {
    messages.value = [];
    error.value = null;
  };

  const setModel = (model: 'gemini' | 'claude') => {
    selectedModel.value = model;
  };

  const setApi = (apiId: string | null) => {
    selectedApi.value = apiId;
  };

  return {
    messages,
    loading,
    error,
    selectedModel,
    selectedApi,
    sendMessage,
    clearMessages,
    setModel,
    setApi
  };
};