import { McpTool } from '../types/mcp.types';
import { ApiService } from '../../../services/api/ApiService';
import { logger } from '../../../utils/logger';

export class ApiDiscoveryTool {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  getToolInfo(): McpTool {
    return {
      name: 'api_discovery',
      description: 'Descubrir APIs disponibles basado en consultas',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Consulta para buscar APIs (ej: "usuarios", "activos")'
          },
          type: {
            type: 'string',
            description: 'Filtrar por tipo de API'
          },
          limit: {
            type: 'number',
            description: 'Límite de resultados',
            default: 10
          }
        }
      }
    };
  }

  async execute(args: any): Promise<any> {
    try {
      const { query, type, limit = 10 } = args;
      const allAPIs = this.apiService.getAllAPIs();

      let filteredAPIs = allAPIs;

      // Filtrar por tipo
      if (type) {
        filteredAPIs = filteredAPIs.filter(api => 
          api.type.toLowerCase().includes(type.toLowerCase())
        );
      }

      // Filtrar por consulta
      if (query) {
        const lowerQuery = query.toLowerCase();
        filteredAPIs = filteredAPIs.filter(api =>
          api.name.toLowerCase().includes(lowerQuery) ||
          api.description.toLowerCase().includes(lowerQuery) ||
          api.keywords.some((keyword: string) => 
            keyword.toLowerCase().includes(lowerQuery)
          ) ||
          api.endpoints.some((endpoint: any) =>
            endpoint.path.toLowerCase().includes(lowerQuery) ||
            endpoint.description.toLowerCase().includes(lowerQuery)
          )
        );
      }

      // Limitar resultados
      const results = filteredAPIs.slice(0, limit);

      return {
        success: true,
        count: results.length,
        total: allAPIs.length,
        apis: results.map(api => ({
          id: api.id,
          name: api.name,
          description: api.description,
          type: api.type,
          baseUrl: api.baseUrl,
          endpoints: api.endpoints.map((e: any) => ({
            path: e.path,
            description: e.description,
            method: e.method
          }))
        })),
        metadata: {
          query,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error en herramienta api_discovery:', error);
      return {
        success: false,
        error: error
      };
    }
  }
}