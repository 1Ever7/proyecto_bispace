// src/types/api.types.ts
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface APIPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface APIRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

export interface DiscoveredAPI {
  name: string;
  baseUrl: string;
  description: string;
  endpoints: APIEndpoint[];
  isActive: boolean;
  lastChecked: string;
}

export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters?: APIParameter[];
  requiresAuth?: boolean;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  in: 'query' | 'path' | 'body' | 'header';
  default?: any;
  enum?: string[];
}

export interface APIDocumentation {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
}

export interface QueryAnalysis {
  intent: 'count' | 'query' | 'list' | 'details' | 'documentation';
  entity: string;
  filters: Record<string, string>;
  targetAPI: string;
  confidence: number;
}