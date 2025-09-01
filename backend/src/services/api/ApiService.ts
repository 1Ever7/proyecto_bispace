import { ApiRegistry } from './apiRegistry';
import { APIConfig, APIStatus } from './types/api.types';
import { logger } from '../../utils/logger';
import { Constants } from '../../config/constants';
import https from 'https';
import fetch, { RequestInit } from 'node-fetch';
import { URL } from 'url';

export class ApiService {
  private registry: ApiRegistry;
    private agent: https.Agent;
    

   constructor(apiRegistry?: ApiRegistry) {
    this.registry = new ApiRegistry();
    this.registry = apiRegistry || new ApiRegistry();
    // Crear agente HTTPS que ignore errores de certificado en desarrollo
    this.agent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    });
  }
  async registerAPI(apiConfig: APIConfig): Promise<boolean> {
    try {
      return this.registry.registerAPI(apiConfig);
    } catch (error) {
      logger.error('Error registrando API:', error);
      throw new Error(`Error al registrar API: ${error}`);
    }
  }

  getAllAPIs(): APIConfig[] {
    return this.registry.getAllAPIs();
  }

  getAPI(apiId: string): APIConfig | undefined {
    return this.registry.getAPI(apiId);
  }

async queryAPI(apiId: string, endpoint: string, params: any = {}): Promise<any> {
  const api = this.registry.getAPI(apiId);
  if (!api) {
    throw new Error(`API ${apiId} no encontrada`);
  }

  const url = `${api.baseUrl}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Constants.DEFAULT_API_TIMEOUT);

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...api.headers,
      },
      agent: this.agent,
      signal: controller.signal,
    };

    const urlWithParams = new URL(url);
    if (params && Object.keys(params).length > 0) {
      Object.keys(params).forEach(key => {
        urlWithParams.searchParams.append(key, params[key]);
      });
    }

    const response = await fetch(urlWithParams.toString(), requestOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error en API: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    } else {
      const text = await response.text();
      logger.error(`La API ${apiId} devolvió un contenido inesperado: ${text.substring(0, 200)}...`);
      throw new Error(`La API ${apiId} no devolvió JSON, recibió HTML u otro formato`);
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Timeout consultando API ${apiId}`);
    }
    logger.error(`Error consultando API ${apiId}:`, error);

    if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      throw new Error(`Error de certificado SSL en la API ${apiId}. Para desarrollo, puedes configurar NODE_TLS_REJECT_UNAUTHORIZED=0`);
    }

    throw new Error(`Error consultando API: ${error.message}`);
  }
}




  async checkAPIHealth(apiId: string): Promise<APIStatus> {
    const api = this.getAPI(apiId);
    if (!api) {
      throw new Error(`API ${apiId} no encontrada`);
    }

    const healthEndpoint = api.healthEndpoint || '/health';
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s para health check

      const response = await fetch(`${api.baseUrl}${healthEndpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...api.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Health check falló: ${response.status}`);
      }

      return {
        id: apiId,
        status: 'healthy',
        responseTime,
        timestamp: new Date(),
        lastChecked: new Date()
      };
    } catch (error: any) {
      return {
        id: apiId,
        status: 'unhealthy',
        timestamp: new Date(),
        lastChecked: new Date(),
        error: error.message
      };
    }
  }

  async checkAllAPIsHealth(): Promise<APIStatus[]> {
    const apis = this.getAllAPIs();
    const healthStatuses: APIStatus[] = [];

    for (const api of apis) {
      try {
        const health = await this.checkAPIHealth(api.id);
        healthStatuses.push(health);
      } catch (error: any) {
        healthStatuses.push({
          id: api.id,
          status: 'unhealthy',
          timestamp: new Date(),
          lastChecked: new Date(),
          error: error.message
        });
      }
    }

    return healthStatuses;
  }
}