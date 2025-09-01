import { APIConfig } from '../../services/api/types/api.types';

export const findRelevantAPI = (apis: APIConfig[], query: string): APIConfig | null => {
  const lowerQuery = query.toLowerCase();
  
  for (const api of apis) {
    // Buscar en keywords
    if (api.keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))) {
      return api;
    }
    
    // Buscar en sinónimos
    if (api.synonyms.some(synonym => lowerQuery.includes(synonym.toLowerCase()))) {
      return api;
    }
    
    // Buscar en nombre y descripción
    if (api.name.toLowerCase().includes(lowerQuery) || api.description.toLowerCase().includes(lowerQuery)) {
      return api;
    }
  }
  
  return null;
};

export const validateAPIConfig = (config: any): boolean => {
  const requiredFields = ['id', 'name', 'baseUrl', 'description'];
  return requiredFields.every(field => config[field]);
};

export const isAPIHealthy = (healthStatus: any): boolean => {
  return healthStatus && healthStatus.status === 'healthy';
};