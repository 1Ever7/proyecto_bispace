import axios from 'axios';
import https from 'https';
import { APIConfig } from '../../config/apis.config';
import { logger, safeLog } from '../../utils/logger';
import { APIError } from '../../utils/errorHandler';

export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  endpoint: string;
  timestamp: string;
}

export class APIQueryService {
  async queryEndpoint(apiConfig: APIConfig, endpointPath: string, params: any = {}): Promise<any> {
  if (!apiConfig || !apiConfig.baseUrl) {
      throw new APIError('Configuración de API no válida', 500, 'INVALID_API_CONFIG');
    }

    try {
      const url = `${apiConfig.baseUrl}${endpointPath}`;
      
      // Configurar agente HTTPS para desarrollo (ignorar certificados)
      const httpsAgent = new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      });

      // Construir query string para parámetros
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      }
      
      const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

      const config: any = {
        timeout: 10000,
        httpsAgent,
        headers: this.getHeaders(apiConfig),
        validateStatus: (status: number) => status < 500
      };

      safeLog.info(`Consultando API: ${fullUrl}`, { config: this.getSafeConfig(config) });
      
      const response = await axios.get(fullUrl, config);
      
      // Si la respuesta no es exitosa, lanzar error
      if (response.status >= 400) {
        throw new APIError(
          `API respondió con estado ${response.status}: ${response.statusText}`,
          response.status,
          'API_ERROR'
        );
      }
      
      return response.data;
    } catch (error: any) {
      safeLog.error(`Error consultando endpoint ${endpointPath}`, error);
      
      if (error.response) {
        // La API respondió con un código de error
        throw new APIError(
          `Error ${error.response.status} desde la API: ${error.response.data?.message || error.response.statusText}`,
          error.response.status,
          'API_RESPONSE_ERROR'
        );
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        throw new APIError(
          'No se recibió respuesta de la API',
          503,
          'API_NO_RESPONSE'
        );
      } else {
        // Error al configurar la petición
        throw new APIError(
          error.message || 'Error desconocido al consultar la API',
          500,
          'API_REQUEST_ERROR'
        );
      }
    }
  }

  // Método auxiliar para obtener configuración segura para logging
  private getSafeConfig(config: any): any {
    const safeConfig = { ...config };
    // Remover agentes y otros objetos complejos
    if (safeConfig.httpsAgent) {
      safeConfig.httpsAgent = '[HTTPS Agent]';
    }
    if (safeConfig.httpAgent) {
      safeConfig.httpAgent = '[HTTP Agent]';
    }
    return safeConfig;
  }




  async queryWithFilters(apiConfig: APIConfig, endpointPath: string, filters: Record<string, any>): Promise<APIResponse> {
    return this.queryEndpoint(apiConfig, endpointPath, filters);
  }

  async countEntities(apiConfig: APIConfig, entityType: string, filters: Record<string, any> = {}): Promise<number> {
    try {
      // Para Sabi API, usar endpoint de cantidad
      if (apiConfig.name === 'sabi-api') {
        const response = await this.queryEndpoint(apiConfig, '/cantidad', {
          tipo: entityType,
          ...filters
        });

        if (response.success && response.data) {
          // Asumir que la respuesta tiene un campo count o total
          return response.data.count || response.data.total || 
                 (Array.isArray(response.data) ? response.data.length : 0);
        }
      }

      // Para otras APIs, hacer query normal y contar resultados
      const endpoint = this.mapEntityToEndpoint(entityType);
      const response = await this.queryEndpoint(apiConfig, endpoint, filters);

      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data.length : 
               (response.data.count || response.data.total || 0);
      }

      return 0;
    } catch (error) {
      logger.error(`Error counting entities ${entityType}:`, error);
      return 0;
    }
  }

  private mapEntityToEndpoint(entityType: string): string {
    const entityMap: Record<string, string> = {
      'usuarios': '/usr',
      'users': '/usr',
      'activos': '/activo',
      'assets': '/activo',
      'altas': '/act_alta',
      'ambientes': '/ambiente',
      'backups': '/backup',
      'bajas': '/baja',
      'cantidades': '/cantidad',
      'condiciones': '/condicion',
      'depreciaciones': '/depreciacion',
      'devoluciones': '/devolucion',
      'edificios': '/edificio',
      'funcionarios': '/funcionario',
      'historiales': '/historial',
      'mantenimientos': '/mantenimiento',
      'programas': '/programa',
      'proveedores': '/proveedor',
      'proyectos': '/proyecto',
      'revalorizaciones': '/revalorizacion',
      'rubros': '/rubro',
      'tipos_activo': '/tipoactivo',
      'ubicaciones': '/ubicacion',
      'qr': '/generarQR'
    };

    return entityMap[entityType] || `/${entityType}`;
  }

   private getHeaders(apiConfig: APIConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'API-Assistant/1.0'
    };

    if (apiConfig.authentication) {
      switch (apiConfig.authentication.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${apiConfig.authentication.token}`;
          break;
        case 'apiKey':
          headers[apiConfig.authentication.key || 'X-API-Key'] = apiConfig.authentication.value || '';
          break;
      }
    }

    return headers;
  }

  
}