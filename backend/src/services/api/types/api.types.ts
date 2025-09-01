// src/services/api/types/api.types.ts

/**
 * Tipos para el sistema de gestión de APIs
 */

// Configuración de endpoint de API
export interface APIEndpointConfig {
  path: string;
  method: string;
  description?: string;
  parameters?: APIParameterConfig[];
  keywords?: string[];
  synonyms?: string[];
  responseFormatter?: 'list' | 'cantidad' | 'electoral' | 'detail' | 'raw' | string;
  requiresAuth?: boolean;
  timeout?: number;
  cacheable?: boolean;
  cacheTTL?: number; // Tiempo de vida de la caché en segundos
}


// Configuración completa de una API
export interface APIConfig {
  id: string;
  name: string;
  baseUrl: string;
  description: string;
  type: string;
  enabled: boolean;
  version?: string;
  active?: boolean;
  endpoints: APIEndpointConfig[];
  keywords: string[];
  synonyms: string[];
  headers?: Record<string, string>;
    healthCheck?: string;
  auth?: {
    type: 'none' | 'bearer' | 'basic' | 'apiKey' | 'oauth2'| string; 
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
    location?: 'header' | 'query';
  };
  healthEndpoint?: string;
  rateLimit?: {
    enabled: boolean;
    maxRequests: number;
    timeWindow: number; // en milisegundos
  };
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number; // en milisegundos
    retryOn?: number[]; // códigos de estado HTTP para reintentar
  };
  timeout?: number; // timeout global en milisegundos
  cacheEnabled?: boolean;
  defaultCacheTTL?: number; // Tiempo de vida de caché por defecto en segundos
  metadata?: Record<string, any>;
  priority?: number;

}

// Estado de salud de una API
export interface APIStatus {
  id: string;
  status: 'healthy' | 'unhealthy' | 'unknown' | 'degraded';
  timestamp: Date;
  responseTime?: number; // en milisegundos
  error?: string;
  lastChecked: Date;
  uptime?: number; // porcentaje de tiempo activo
  successRate?: number; // porcentaje de solicitudes exitosas
  totalRequests?: number;
  failedRequests?: number;
  details?: Record<string, any>;
}

// Respuesta de una consulta a API
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
  apiId: string;
  endpoint: string;
  responseTime: number; // en milisegundos
  statusCode?: number;
  headers?: Record<string, string>;
  metadata?: {
    cacheHit?: boolean;
    retryCount?: number;
    rateLimitRemaining?: number;
    rateLimitReset?: Date;
  };
}

// Estadísticas de uso de API
export interface APIUsageStats {
  apiId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequest: Date;
  endpoints: {
    [endpoint: string]: {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      averageResponseTime: number;
    };
  };
  timeSeries?: {
    timestamp: Date;
    requests: number;
    successRate: number;
    averageResponseTime: number;
  }[];
}

// Datos para registro de una nueva API
export interface APIRegistrationData {
  id: string;
  name: string;
  baseUrl: string;
  description: string;
  type: string;
  endpoints: APIEndpointConfig[];
  keywords: string[];
  synonyms: string[];
  headers?: Record<string, string>;
  auth?: APIConfig['auth'];
  healthEndpoint?: string;
}

// Opciones para consulta a API
export interface APIQueryOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  method?: string;
  skipAuth?: boolean;
}

// Resultado de descubrimiento de endpoints
export interface EndpointDiscoveryResult {
  apiId: string;
  discoveredEndpoints: APIEndpointConfig[];
  timestamp: Date;
  success: boolean;
  error?: string;
}

// Eventos del sistema de API
export interface APIEvent {
  type: 'registration' | 'health_check' | 'query' | 'error' | 'rate_limit' | 'cache_hit' | 'cache_miss';
  timestamp: Date;
  apiId?: string;
  endpoint?: string;
  data?: any;
  message: string;
}

// Configuración del registro de APIs
export interface APIRegistryConfig {
  autoDiscoverEndpoints: boolean;
  healthCheckInterval: number; // en milisegundos
  cacheEnabled: boolean;
  defaultCacheTTL: number; // en segundos
  maxAPIs: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Filtros para búsqueda de APIs
export interface APIFilter {
  active?: boolean;
  type?: string;
  keyword?: string;
  hasHealthEndpoint?: boolean;
}

// Resultado paginado de APIs
export interface PaginatedAPIs {
  data: APIConfig[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Estructura para reporte de salud del sistema
export interface HealthReport {
  timestamp: Date;
  totalAPIs: number;
  healthyAPIs: number;
  unhealthyAPIs: number;
  unknownAPIs: number;
  apis: APIStatus[];
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    environment: string;
    version: string;
  };
}

// Tipos para operaciones de caché
export interface APICache {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

// Clave para caché de API
export interface APICacheKey {
  apiId: string;
  endpoint: string;
  params: Record<string, any>;
  method: string;
}

// Tipos para políticas de reintento
export interface RetryPolicy {
  maxRetries: number;
  delay: number;
  shouldRetry: (error: any) => boolean;
  onRetry?: (retryCount: number, error: any) => void;
}

// Tipos para limitación de tasa
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

// Error personalizado para APIs
export class APIError extends Error {
  constructor(
    message: string,
    public apiId: string,
    public endpoint: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Tipo para función de formateo de respuesta
export type ResponseFormatter = (data: any, endpointConfig: APIEndpointConfig) => any;

// Mapa de formateadores de respuesta
export interface ResponseFormatters {
  list: ResponseFormatter;
  cantidad: ResponseFormatter;
  electoral: ResponseFormatter;
  detail: ResponseFormatter;
  raw: ResponseFormatter;
}

// Tipo para función de transformación de solicitud
export type RequestTransformer = (config: APIConfig, endpoint: string, options: APIQueryOptions) => {
  url: string;
  init: RequestInit;
};

// Configuración para descubrimiento automático de endpoints
export interface AutoDiscoveryConfig {
  enabled: boolean;
  pathsToTry: string[];
  methodsToTry: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  timeoutPerRequest: number;
  concurrentRequests: number;
}

// Resultado de validación de configuración de API
export interface APIValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Tipos para el sistema de plugins de API
export interface APIPlugin {
  name: string;
  version: string;
  init: (registry: any) => void;
  beforeRequest?: (apiId: string, endpoint: string, options: APIQueryOptions) => Promise<void> | void;
  afterRequest?: (apiId: string, endpoint: string, response: any, error?: any) => Promise<void> | void;
  transformResponse?: (apiId: string, endpoint: string, data: any) => Promise<any> | any;
}
export interface APIParameterConfig {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  example?: any;
  in?: "query" | "path" | "body";
}