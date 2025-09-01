import { McpTool } from '../types/mcp.types';
import { ApiService } from '../../../services/api/ApiService';
import { logger } from '../../../utils/logger';

export class ApiQueryTool {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  getToolInfo(): McpTool {
    return {
      name: 'api_query',
      description: 'Consultar endpoints de APIs dinámicas registradas',
      inputSchema: {
        type: 'object',
        properties: {
          apiId: {
            type: 'string',
            description: 'ID de la API a consultar'
          },
          endpoint: {
            type: 'string',
            description: 'Endpoint a consultar (ej: /usuarios)'
          },
          params: {
            type: 'object',
            description: 'Parámetros de consulta',
            additionalProperties: true
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE'],
            default: 'GET'
          }
        },
        required: ['apiId', 'endpoint']
      }
    };
  }

  async execute(args: any): Promise<any> {
    try {
      const { apiId, endpoint, params = {}, method = 'GET' } = args;

      //logger.info(`Ejecutando herramienta api_query: ${apiId}${endpoint}`);

      // Para métodos diferentes a GET, necesitaríamos modificar ApiService
      const data = await this.apiService.queryAPI(apiId, endpoint, params);

      return {
        success: true,
        data: data,
        metadata: {
          apiId,
          endpoint,
          method,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error en herramienta api_query:', error);
      return {
        success: false,
        error: error,
        suggestion: 'Verifique que la API esté disponible y los parámetros sean correctos'
      };
    }
  }
}