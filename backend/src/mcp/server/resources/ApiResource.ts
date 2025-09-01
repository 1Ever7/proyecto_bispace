import { McpResource } from '../types/mcp.types';
import { ApiService } from '../../../services/api/ApiService';
import { logger } from '../../../utils/logger';

export class ApiResource {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  getResourceInfo(): McpResource {
    return {
      uri: 'api://{apiId}/{endpoint}',
      name: 'API Resource',
      description: 'Acceso a endpoints de APIs dinámicas registradas',
      mimeType: 'application/json'
    };
  }

  async read(uri: string): Promise<any> {
    try {
      // Parsear URI: api://sabi/usuarios
      const match = uri.match(/^api:\/\/([^\/]+)\/(.+)$/);
      if (!match) {
        throw new Error(`URI inválida: ${uri}`);
      }

      const apiId = match[1];
      const endpoint = match[2];

      //logger.info(`Leyendo recurso MCP: ${uri}`);

      const data = await this.apiService.queryAPI(apiId, `/${endpoint}`, {});
      
      return {
        content: JSON.stringify(data, null, 2),
        mimeType: 'application/json'
      };
    } catch (error) {
        
      logger.error(`Error leyendo recurso API ${uri}:`, error);
      throw new Error(`No se pudo leer el recurso: ${error}`);
    }
  }

  async list(): Promise<string[]> {
    const apis = this.apiService.getAllAPIs();
    const uris: string[] = [];

    for (const api of apis) {
      for (const endpoint of api.endpoints) {
        uris.push(`api://${api.id}${endpoint.path}`);
      }
    }

    return uris;
  }
}