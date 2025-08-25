// src/services/api/APIDiscoverer.ts
import axios from 'axios';
import https from 'https';
import { APIConfig, EndpointConfig } from '../../config/apis.config';
import { logger } from '../../utils/logger';

export class APIDiscoverer {
  private timeout: number = 5000;

  async discoverEndpoints(apiConfig: APIConfig): Promise<EndpointConfig[]> {
    try {
      // Si es tipo swagger o mixed, intentar obtener Swagger primero
      if (apiConfig.type === 'swagger' || apiConfig.type === 'mixed') {
        try {
          const swaggerData = await this.loadSwaggerDocumentation(apiConfig);
          return this.extractEndpointsFromSwagger(swaggerData, apiConfig.baseUrl);
        } catch (error) {
          logger.warn(`No se pudo obtener Swagger para ${apiConfig.name}: ${error}`);
          // Continuar con endpoints estáticos si hay error con Swagger
        }
      }
      
      // Fallback a configuración estática
      return apiConfig.endpoints || [];
    } catch (error) {
      logger.error(`Error descubriendo endpoints para ${apiConfig.name}:`, error);
      return apiConfig.endpoints || [];
    }
  }

  private async loadSwaggerDocumentation(apiConfig: APIConfig): Promise<any> {
    // Try the custom swaggerUrl first if provided
    if (apiConfig.swaggerUrl) {
      try {
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const response = await axios.get(apiConfig.swaggerUrl, {
          timeout: this.timeout,
          httpsAgent,
          headers: { 
            'User-Agent': 'API-Discoverer/1.0',
            'Accept': 'application/json'
          }
        });
        
        if (response.data) {
          return response.data;
        }
      } catch (error) {
        logger.warn(`No se pudo acceder a swaggerUrl personalizado: ${apiConfig.swaggerUrl}`, error);
        // Continue with standard paths
      }
    }

    // Standard OpenAPI/Swagger paths to try
    const possiblePaths = [
      '/swagger.json',
      '/api-docs',
      '/docs',
      '/openapi.json',
      '/api-docs/json',
      '/v2/api-docs',
      '/v3/api-docs'
    ];

    for (const docsPath of possiblePaths) {
      try {
        const url = `${apiConfig.baseUrl}${docsPath}`;
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        
        const response = await axios.get(url, {
          timeout: this.timeout,
          httpsAgent,
          headers: { 
            'User-Agent': 'API-Discoverer/1.0',
            'Accept': 'application/json'
          }
        });

        if (response.data) {
          return response.data;
        }
      } catch (error) {
        // Continuar con el siguiente path
        continue;
      }
    }

    throw new Error('No se pudo encontrar documentación Swagger/OpenAPI');
  }

  private extractEndpointsFromSwagger(swaggerData: any, baseUrl: string): EndpointConfig[] {
    const endpoints: EndpointConfig[] = [];

    if (!swaggerData.paths) {
      return endpoints;
    }

    for (const [path, methods] of Object.entries(swaggerData.paths)) {
      for (const [method, details] of Object.entries(methods as any)) {
        if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
          const operation = details as any;
          endpoints.push({
            path,
            method: method.toUpperCase(),
            description: operation.summary || operation.description || `${method} ${path}`,
            parameters: this.extractParametersFromSwagger(operation.parameters),
            responseSchema: this.extractResponseSchema(operation.responses),
            tags: operation.tags || []
          });
        }
      }
    }

    return endpoints;
  }

  private extractParametersFromSwagger(parameters: any[]): any[] {
    if (!parameters) return [];

    return parameters.map(param => ({
      name: param.name,
      type: param.schema?.type || 'string',
      required: param.required || false,
      description: param.description || '',
      in: param.in || 'query',
      default: param.default,
      enum: param.schema?.enum
    }));
  }

  private extractResponseSchema(responses: any): any {
    if (!responses) return {};
    
    // Intentar obtener schema de respuesta 200
    const successResponse = responses['200'] || responses[200] || 
                           responses['201'] || responses[201] ||
                           Object.values(responses)[0];
    
    if (successResponse && successResponse.content) {
      const jsonContent = successResponse.content['application/json'];
      return jsonContent?.schema || {};
    }
    
    return {};
  }
}