import { defineStore } from 'pinia';
import type { ChatRequest, ChatResponse } from '~/types/api';
import { apiClient } from '~/utils/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as ChatMessage[],
    currentMessage: '',
    loading: false,
    error: null as string | null,
    selectedModel: 'claude' as 'gemini' | 'claude',
    selectedApi: null as string | null,
    temperature: 0.7,
  }),

  actions: {
    async sendMessage(message: string) {
      this.loading = true;
      this.error = null;
      
      // Add user message to history
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      this.messages.push(userMessage);
      
      try {
        const request: ChatRequest = {
          message,
          model: this.selectedModel,
          apiId: this.selectedApi || undefined,
          temperature: this.temperature,
        };
        
        const response = await apiClient.sendMessage(request);
        
        // Add assistant response to history
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
        };
        this.messages.push(assistantMessage);
        
        return response;
      } catch (error: any) {
        this.error = error.message;
        
        // Add error message
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Lo siento, ha ocurrido un error: ${error.message}`,
          timestamp: new Date(),
        };
        this.messages.push(errorMessage);
        
        throw error;
      } finally {
        this.loading = false;
      }
    },

    clearMessages() {
      this.messages = [];
      this.error = null;
    },

    setModel(model: 'gemini' | 'claude') {
      this.selectedModel = model;
    },

    setApi(apiId: string | null) {
      this.selectedApi = apiId;
    },

    setTemperature(temp: number) {
      this.temperature = Math.max(0, Math.min(1, temp));
    },
  },

  getters: {
    conversationHistory: (state) => {
      return state.messages;
    },
    
    isProcessing: (state) => {
      return state.loading;
    },
  },
});