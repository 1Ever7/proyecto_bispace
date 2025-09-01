export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIServiceOptions {
  temperature?: number;
  maxTokens?: number;
}

// src/services/ia/ia.types.ts

export type IAModel = 'claude' | 'gemini';
