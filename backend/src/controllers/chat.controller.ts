import { Request, Response } from 'express';
import { AIService } from '../services/ia/iaService';
import { ApiService } from '../services/api/ApiService';
import { formatSuccessResponse, formatErrorResponse } from '../utils/formatters/apiResponseFormatter';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/global.types';
import { Constants } from '../config/constants';
import { APIConfig, APIEndpointConfig } from '../services/api/types/api.types';

export class ChatController {
  private aiService: AIService;
  private apiService: ApiService;
  private claudeRateLimited = false;
  private lastRateLimitTime: number = 0;

  constructor() {
    this.aiService = new AIService();
    this.apiService = new ApiService();
  }


private async determineBestAPI(message: string): Promise<string | null> {
  const allAPIs = this.apiService.getAllAPIs();
  const lowerMessage = message.toLowerCase();

  for (const api of allAPIs) {
    // Buscar coincidencia en keywords o sinónimos
    const hasKeyword = api.keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
    const hasSynonym = api.synonyms.some(synonym => lowerMessage.includes(synonym.toLowerCase()));

    // Buscar coincidencia en nombre o id
    const hasName = lowerMessage.includes(api.name.toLowerCase()) || lowerMessage.includes(api.id.toLowerCase());

    if (hasKeyword || hasSynonym || hasName) {
      logger.info(`API detectada automáticamente: ${api.id}`);
      return api.id;
    }
  }

  logger.warn('No se pudo detectar automáticamente ninguna API para el mensaje');
  return null;
}

// Modificar el método handleMessage
handleMessage = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { message, model = 'claude', apiId, timeout } = req.body;

    // Validaciones
    if (!message) {
      res.status(400).json(formatErrorResponse('Mensaje requerido'));
      return;
    }

    logger.info(`Procesando mensaje: "${message}"`);

    // Determinar la API a usar
    let targetAPI = apiId;
    if (!targetAPI) {
      targetAPI = await this.determineBestAPI(message);
    }

    let apiData = null;
    if (targetAPI) {
      try {
        apiData = await this.getAPIDataForMessage(targetAPI, message);
        logger.info(`Datos obtenidos de API: ${targetAPI}`);
      } catch (error) {
        logger.warn(`Error obteniendo datos de API ${targetAPI}:`, error);
        apiData = { error: `No se pudieron obtener datos de ${targetAPI}` };
      }
    }

    // Construir prompt con contexto
    const prompt = this.buildPromptWithContext(message, apiData, targetAPI);
    
    // Procesar con IA
    //const aiResponse = await this.aiService.processMessage(prompt, null, model);
// Procesar con IA usando manejo de rate limit
const aiResponse = await this.handleRateLimit(model, prompt, null);

    const responseData = {
      response: aiResponse,
      processingTime: `${Date.now() - startTime}ms`,
      usedModel: model,
      apiData: targetAPI ? `Datos de API: ${targetAPI}` : 'No se usó API específica'
    };

    res.json(formatSuccessResponse(responseData));

  } catch (error) {
    logger.error('Error en handleMessage:', error);
    res.status(500).json(formatErrorResponse('Error procesando mensaje'));
  }
};




private determineRelevantAPIs(message: string): APIConfig[] {
  const allAPIs = this.apiService.getAllAPIs();
  const lowerMessage = message.toLowerCase();
  
  const scoredAPIs = allAPIs.map(api => {
    let score = 0;
    
    // Buscar en keywords
    api.keywords.forEach((keyword: string) => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });
    
    // Buscar en sinónimos
    api.synonyms.forEach((synonym: string) => {
      if (lowerMessage.includes(synonym.toLowerCase())) {
        score += 1;
      }
    });
    
    return { api, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);
  
  return scoredAPIs.map(item => item.api);
}


  private async handleRateLimit(model: string, message: string, context: any): Promise<string> {
    if (model === Constants.AI_MODELS.CLAUDE && this.claudeRateLimited) {
      const timeSinceLimit = Date.now() - this.lastRateLimitTime;
      if (timeSinceLimit < 60000) {
        logger.warn(`Claude API en rate limit, usando Gemini como fallback`);
        return this.processWithFallback(message, context, Constants.AI_MODELS.GEMINI);
      } else {
        this.claudeRateLimited = false;
      }
    }
    
    try {
      return await this.aiService.processMessage(message, context, model);
    } catch (error: any) {
      if (model === Constants.AI_MODELS.CLAUDE && error.message?.includes('rate_limit')) {
        logger.warn(`Rate limit detectado en Claude API, cambiando a Gemini`);
        this.claudeRateLimited = true;
        this.lastRateLimitTime = Date.now();
        return this.processWithFallback(message, context, Constants.AI_MODELS.GEMINI);
      }
      throw error;
    }
  }

  private async processWithFallback(message: string, context: any, fallbackModel: string): Promise<string> {
    try {
      return await this.aiService.processMessage(message, context, fallbackModel);
    } catch (fallbackError) {
      logger.error(`Error con modelo de fallback ${fallbackModel}:`, fallbackError);
      throw fallbackError;
    }
  }

private async getAPIDataForMessage(apiId: string, message: string): Promise<any> {
  const api = this.apiService.getAPI(apiId);
  if (!api) {
    throw new Error(`API ${apiId} no encontrada`);
  }

    // Buscar el endpoint más relevante para el mensaje
  const relevantEndpoint = this.findMostRelevantEndpoint(api, message);
  
  if (!relevantEndpoint) {
    return { 
      api: api.name, 
      message: 'No se encontró endpoint específico, usando información general',
      endpoints: api.endpoints.map(e => e.path)
    };
  }

  try {
    // Consulta al ApiService
    const apiData = await this.apiService.queryAPI(apiId, relevantEndpoint.path, {});
    // Limitar tamaño del JSON (ejemplo: 5000 caracteres)
    const limitedData = JSON.stringify(apiData).substring(0, 5000);
    return {
      api: api.name,
      endpoint: relevantEndpoint.path,
      data: limitedData // <-- aquí el JSON limitado
    };
  } catch (error) {
    logger.error(`Error consultando endpoint ${relevantEndpoint.path}:`, error);
    throw new Error(`Error obteniendo datos: ${error}`);
  }
}


private findMostRelevantEndpoint(api: APIConfig, message: string): APIEndpointConfig | null {
  const lowerMessage = message.toLowerCase();
  let bestMatch: APIEndpointConfig | null = null;
  let highestScore = 0;

  api.endpoints.forEach((endpoint: APIEndpointConfig) => {
    let score = 0;

    // Keywords extraídas de la descripción del endpoint
    const endpointKeywords = endpoint.description
      ? endpoint.description.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      : [];

    // Coincidencia exacta con la descripción
    if (endpoint.description && lowerMessage.includes(endpoint.description.toLowerCase())) {
      score += 5;
    }

    // Coincidencia parcial con palabras clave de la descripción
    const matches = endpointKeywords.filter(word => lowerMessage.includes(word)).length;
    score += matches;

    // Coincidencia con el path
    if (endpoint.path && lowerMessage.includes(endpoint.path.toLowerCase())) {
      score += 3;
    }

    // Coincidencia con keywords globales del API
    api.keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });

    // Coincidencia con sinónimos del API
    api.synonyms.forEach(syn => {
      if (lowerMessage.includes(syn.toLowerCase())) {
        score += 2;
      }
    });

    // Coincidencia con método de acción
    const actionTerms = ['listar', 'obtener', 'mostrar', 'traer', 'ver', 'consultar', 'crear', 'eliminar', 'actualizar'];
    actionTerms.forEach(term => {
      if (lowerMessage.includes(term)) {
        if (endpoint.method === 'GET' && ['listar', 'obtener', 'mostrar', 'traer', 'ver', 'consultar'].includes(term)) {
          score += 1;
        }
        if (endpoint.method === 'POST' && ['crear', 'registrar', 'guardar'].includes(term)) {
          score += 1;
        }
        if (endpoint.method === 'DELETE' && ['eliminar', 'borrar', 'quitar'].includes(term)) {
          score += 1;
        }
        if (endpoint.method === 'PUT' && ['actualizar', 'editar', 'modificar'].includes(term)) {
          score += 1;
        }
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = endpoint;
    }
  });

  return bestMatch;
}


private buildPromptWithContext(message: string, apiData: any, apiId: string): string {
  if (!apiData || !apiData.data) {
    return message; // Devolver mensaje original si no hay datos
  }

  const api = this.apiService.getAPI(apiId);
  
  // Verificar que api no es undefined
  if (!api) {
    return `
No tengo acceso a la API solicitada (${apiId}).
Por favor, verifica que la API esté correctamente configurada.

PREGUNTA: "${message}"
`;
  }
  
  // Construir prompt más liviano
  return `
El usuario preguntó: ${message}

Datos relevantes del sistema (${api.name}):
${apiData.data}
`;
}



}

export const chatController = new ChatController();