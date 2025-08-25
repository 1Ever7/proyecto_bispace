import { QueryAnalysis } from '../../types/api.types';

export interface AIService {
  processMessage(
    prompt: string,
    options?: AIServiceOptions
  ): Promise<string>;

  processChat(
    messages: ChatMessage[],
    options?: AIServiceOptions
  ): Promise<string>;

  analyzeQuery?(query: string): Promise<QueryAnalysis>;
}

export interface AIServiceOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  model?: string;
  systemPrompt?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
  finishReason: string;
}