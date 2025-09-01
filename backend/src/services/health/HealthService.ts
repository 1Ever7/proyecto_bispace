import { ApiService } from '../api/ApiService';
import { APIStatus } from '../api/types/api.types';
import { logger } from '../../utils/logger';

export class HealthService {
  private apiService: ApiService;
  private healthStatuses: Map<string, APIStatus> = new Map();

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    this.startHealthChecks();
  }

  async checkAllAPIsHealth(): Promise<APIStatus[]> {
    const apis = this.apiService.getAllAPIs();
    const healthStatuses: APIStatus[] = [];

    for (const api of apis) {
      try {
        const health = await this.apiService.checkAPIHealth(api.id);
        this.healthStatuses.set(api.id, health);
        healthStatuses.push(health);
      } catch (error: any) {
        const status: APIStatus = {
          id: api.id,
          status: 'unhealthy',
          timestamp: new Date(),
          lastChecked: new Date(), // AÑADIR ESTA LÍNEA
          error: error.message
        };
        this.healthStatuses.set(api.id, status);
        healthStatuses.push(status);
      }
    }

    return healthStatuses;
  }

  getAPIHealth(apiId: string): APIStatus | undefined {
    return this.healthStatuses.get(apiId);
  }

  getAllHealthStatuses(): APIStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  private startHealthChecks(): void {
    // Ejecutar chequeo inicial
    this.checkAllAPIsHealth().catch(error => {
      logger.error('Error en chequeo inicial de salud:', error);
    });

    // Configurar chequeos periódicos
    setInterval(() => {
      this.checkAllAPIsHealth().catch(error => {
        logger.error('Error en chequeo periódico de salud:', error);
      });
    }, 60000); // Cada minuto
  }
}