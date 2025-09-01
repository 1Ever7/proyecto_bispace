export interface IAConfig {
  defaultModel: string;
  fallbackModel: string;
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  timeout: number;
  maxTokens: number;
}

export const iaConfig: IAConfig = {
  defaultModel: 'claude',
  fallbackModel: 'gemini',
  rateLimit: {
    enabled: true,
    requestsPerMinute: 60
  },
  timeout: 45000,
  maxTokens: 4000
};

export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  endpoint: string;
  maxTokens: number;
  temperature: number;
}

export const aiModels: Record<string, AIModelConfig> = {
  claude: {
    id: 'claude',
    name: 'Claude AI',
    provider: 'anthropic',
    apiKey: process.env.CLAUDE_API_KEY || '',
    endpoint: 'https://api.anthropic.com/v1/messages',
    maxTokens: 4000,
    temperature: 0.7
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    provider: 'google',
    apiKey: process.env.GEMINI_API_KEY || '',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    maxTokens: 4000,
    temperature: 0.7
  }
};