//src\services\api\apiRegistry.ts
import { APIConfig } from './types/api.types';
import { apiConfigurations } from '../../config/apis.config';
import { logger } from '../../utils/logger';

export class ApiRegistry {
  
  

  private apis: Map<string, APIConfig> = new Map();

  constructor() {
    this.initializeAPIs();
    
  }

  public initializeAPIs(): void {
    apiConfigurations.forEach(api => {
      this.registerAPI(api);
    });
  }

registerAPI(apiConfig: APIConfig): boolean {
  if (this.apis.has(apiConfig.id)) {
    logger.warn(`API con ID ${apiConfig.id} ya existe`);
    return false;
  }

  const apiWithActive = { ...apiConfig, active: apiConfig.active ?? true }; // <- default a true
  this.apis.set(apiConfig.id, apiWithActive);

  //logger.info(`API registrada: ${apiWithActive.id} - ${apiWithActive.name}`);
  return true;
}


  getAPI(apiId: string): APIConfig | undefined {
    return this.apis.get(apiId);
  }

  getAllAPIs(): APIConfig[] {
    return Array.from(this.apis.values());
  }

  getActiveAPIs(): APIConfig[] {
    return this.getAllAPIs().filter(api => api.active);
  }

  updateAPI(apiId: string, updates: Partial<APIConfig>): boolean {
    const api = this.getAPI(apiId);
    if (!api) return false;

    const updatedAPI = { ...api, ...updates };
    this.apis.set(apiId, updatedAPI);
    logger.info(`API actualizada: ${apiId}`);
    return true;
  }

  deleteAPI(apiId: string): boolean {
    if (!this.apis.has(apiId)) return false;

    this.apis.delete(apiId);
    logger.info(`API eliminada: ${apiId}`);
    return true;
  }
}