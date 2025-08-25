// src/services/api/APIManager.ts
import { APIConfig, getAPIConfig, getAllAPIConfigs } from '../../config/apis.config';
import { APIDiscoverer } from './apiDiscoverer';
import { APIDocumenter } from './apiDocumenter';
import { APIQueryService } from './apiQuery';
import { logger } from '../../utils/logger';

export class APIManager {
  private discoverer: APIDiscoverer;
  private documenter: APIDocumenter;
  private queryService: APIQueryService;
  private apiCache: Map<string, any> = new Map();

  constructor() {
    this.discoverer = new APIDiscoverer();
    this.documenter = new APIDocumenter();
    this.queryService = new APIQueryService();
  }

  // Obtener todas las APIs configuradas
  async getAllAPIs(): Promise<APIConfig[]> {
    return getAllAPIConfigs();
  }

  // Obtener una API específica
  async getAPI(apiId: string): Promise<APIConfig | null> {
    const config = getAPIConfig(apiId);
    if (!config) return null;

    // Si es una API Swagger, descubrir endpoints dinámicamente
    if (config.type === 'swagger' || config.type === 'mixed') {
      try {
        const endpoints = await this.discoverer.discoverEndpoints(config);
        return { ...config, endpoints };
      } catch (error) {
        logger.warn(`No se pudieron descubrir endpoints para ${apiId}: ${error}`);
      }
    }

    return config;
  }

  // Obtener documentación de una API
  async getAPIDocumentation(apiId: string, format: 'openapi' | 'markdown' = 'openapi'): Promise<any> {
    const api = await this.getAPI(apiId);
    if (!api) {
      throw new Error(`API ${apiId} no encontrada`);
    }

    // Si no tenemos endpoints, intentar descubrirlos
    if (!api.endpoints || api.endpoints.length === 0) {
      api.endpoints = await this.discoverer.discoverEndpoints(api);
    }

    if (format === 'openapi') {
      return this.documenter.generateSwaggerDocument(api, api.endpoints);
    } else {
      return this.documenter.generateMarkdownDocumentation(api, api.endpoints);
    }
  }

  // Obtener documentación consolidada de todas las APIs
  async getConsolidatedDocumentation(format: 'openapi' | 'markdown' = 'openapi'): Promise<any> {
    const apis = await this.getAllAPIs();
    const allEndpoints: any[] = [];

    for (const api of apis) {
      try {
        let endpoints = api.endpoints;
        if (!endpoints || endpoints.length === 0) {
          endpoints = await this.discoverer.discoverEndpoints(api);
        }
        
        endpoints.forEach(endpoint => {
          allEndpoints.push({
            ...endpoint,
            api: api.id,
            baseUrl: api.baseUrl
          });
        });
      } catch (error) {
        logger.warn(`No se pudieron obtener endpoints para ${api.id}: ${error}`);
      }
    }

    if (format === 'openapi') {
      // Crear documento OpenAPI consolidado
      const consolidatedDoc = {
        openapi: '3.0.0',
        info: {
          title: 'APIs Consolidadas',
          version: '1.0.0',
          description: 'Documentación consolidada de todas las APIs del sistema'
        },
        servers: apis.map(api => ({
          url: api.baseUrl,
          description: api.description
        })),
        paths: this.documenter.consolidatePaths(allEndpoints),
        components: {
          schemas: {},
          securitySchemes: this.documenter.consolidateSecuritySchemes(apis)
        }
      };

      return consolidatedDoc;
    } else {
      // Generar markdown consolidado
      let markdown = '# Documentación Consolidada de APIs\n\n';
      
      for (const api of apis) {
        markdown += `## ${api.name}\n\n`;
        markdown += `**Descripción:** ${api.description}\n\n`;
        markdown += `**URL Base:** ${api.baseUrl}\n\n`;
        
        try {
          const apiDoc = await this.getAPIDocumentation(api.id, 'markdown');
          markdown += apiDoc + '\n\n';
        } catch (error) {
          markdown += `*No se pudo generar documentación para esta API*\n\n`;
        }
      }
      
      return markdown;
    }
  }

  // Consultar un endpoint de API
  async queryAPI(apiId: string, endpointPath: string, params: any = {}): Promise<any> {
    const api = await this.getAPI(apiId);
    if (!api) {
      throw new Error(`API ${apiId} no encontrada`);
    }
  // Asegurarse de que la API tiene baseUrl
  if (!api.baseUrl) {
    throw new Error(`API ${apiId} no tiene baseUrl configurada`);
  }
    return this.queryService.queryEndpoint(api, endpointPath, params);
  }

  // Analizar una pregunta sobre las APIs
  async analyzeQuestion(question: string): Promise<{
    intent: string;
    targetAPI: string | null;
    endpoint: string | null;
    parameters: Record<string, any>;
    confidence: number;
  }> {
    // Implementar análisis de intención usando IA si está disponible
    // Por ahora, una implementación básica
    
    const lowerQuestion = question.toLowerCase();
    let intent = 'query';
    let targetAPI = null;
    let endpoint = null;
    const parameters: Record<string, any> = {};
    let confidence = 0.5;

    // Detectar API objetivo
    const apis = await this.getAllAPIs();
    for (const api of apis) {
      if (lowerQuestion.includes(api.id) || lowerQuestion.includes(api.name.toLowerCase())) {
        targetAPI = api.id;
        confidence += 0.2;
        break;
      }
    }

    // Detectar intención específica
    if (lowerQuestion.includes('cuántos') || lowerQuestion.includes('cantidad')) {
      intent = 'count';
      confidence += 0.1;
    }

    if (lowerQuestion.includes('documentación') || lowerQuestion.includes('docs')) {
      intent = 'documentation';
      confidence += 0.1;
    }

    // Extraer parámetros simples (implementación básica)
    const paramRegex = /(\w+):\s*([^\s]+)/g;
    let match;
    while ((match = paramRegex.exec(question)) !== null) {
      parameters[match[1]] = match[2];
    }

    return { intent, targetAPI, endpoint, parameters, confidence };
  }
// In src/services/api/APIManager.ts, add this method:
async countEntities(apiId: string, entityType: string, filters: Record<string, any> = {}): Promise<number> {
  const api = await this.getAPI(apiId);
  if (!api) {
    throw new Error(`API ${apiId} no encontrada`);
  }

  // For Sabi API, use the /cantidad endpoint
  if (apiId === 'sabi') {
    try {
      const response = await this.queryService.queryEndpoint(api, '/cantidad', {
        tipo: entityType,
        ...filters
      });
      return response.count || response.data?.length || 0;
    } catch (error) {
      // Fallback to counting the array length if /cantidad fails
      const response = await this.queryService.queryEndpoint(api, `/${entityType}`, filters);
      return Array.isArray(response) ? response.length : 0;
    }
  } else {
    // For other APIs, try to query the entity endpoint and count the results
    const response = await this.queryService.queryEndpoint(api, `/${entityType}`, filters);
    return Array.isArray(response) ? response.length : 0;
  }
}

// Alternative version for more concise output
async getConsolidatedAPIInfo(): Promise<string> {
  try {
    const apis = await this.getAllAPIs();
    let apiInfo = 'Available APIs:\n\n';

    for (const api of apis) {
      const apiWithEndpoints = await this.getAPI(api.id);
      
      apiInfo += `## ${api.name}\n`;
      apiInfo += `- Description: ${api.description}\n`;
      apiInfo += `- Base URL: ${api.baseUrl}\n`;
      
      if (apiWithEndpoints?.endpoints && apiWithEndpoints.endpoints.length > 0) {
        apiInfo += `- Endpoints:\n`;
        apiWithEndpoints.endpoints.forEach(endpoint => {
          apiInfo += `  - ${endpoint.method} ${endpoint.path}: ${endpoint.description}\n`;
        });
      }
      
      apiInfo += '\n';
    }

    return apiInfo;
  } catch (error) {
    logger.error('Error generating consolidated API info:', error);
    return 'Available APIs information could not be retrieved.';
  }
}

}