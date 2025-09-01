export interface APIConfig {
  id: string;
  name: string;
  baseUrl: string;
  description: string;
  type: string;
  active: boolean;
  keywords: string[];
  synonyms: string[];
  endpoints: APIEndpointConfig[];
  healthEndpoint?: string;
}

export interface APIEndpointConfig {
  path: string;
  description: string;
  method: string;
  responseFormatter?: string;
}

export interface APIHealth {
  id: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  successRate?: number;
  totalRequests?: number;
  failedRequests?: number;
  timestamp: string;
  error?: string;
}

export interface ChatRequest {
  message: string;
  model?: 'gemini' | 'claude';
  apiId?: string;
  temperature?: number;
  timeout?: number;
}

export interface ChatResponse {
  response: string;
  processingTime: string;
  usedModel: string;
  apiData?: string;
  relevantAPIs?: string[];
}