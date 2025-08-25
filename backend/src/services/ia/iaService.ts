// src/services/ia/IAService.ts
// src/services/ia/IAService.ts
import { APIManager } from '../api/apiManager';
import { IAModel } from '../../config/ia.config';
import { iaFactory } from './ia.factory';
import { logger } from '../../utils/logger';

export class IAService {
  private apiManager: APIManager;

  constructor() {
    this.apiManager = new APIManager();
  }

  

  async analyzeEndpoints(question: string, model: IAModel = 'claude'): Promise<string> {
    try {
      // Obtener información detallada de todos los endpoints
      const endpointsAnalysis = await this.getDetailedEndpointsAnalysis();
      
      const prompt = `
Eres un arquitecto de software senior especializado en análisis de APIs. Analiza la pregunta del usuario sobre los endpoints disponibles.

CONTEXTO DE LOS ENDPOINTS DISPONIBLES:
${endpointsAnalysis}

PREGUNTA DEL USUARIO: "${question}"

Responde de manera técnica y profunda, incluyendo:
1. Análisis de los endpoints relevantes
2. Parámetros requeridos y opcionales
3. Ejemplos de uso práctico
4. Posibles integraciones
5. Mejores prácticas para el uso
6. Consideraciones de seguridad si aplican

Sé específico y proporciona ejemplos concretos.
      `;

      const aiService = iaFactory.createService(model);
      const answer = await aiService.processMessage(prompt);

      return answer;
    } catch (error) {
      logger.error('Error analizando endpoints:', error);
      throw new Error(`Error al analizar endpoints: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  private async getDetailedEndpointsAnalysis(): Promise<string> {
    try {
      const apis = await this.apiManager.getAllAPIs();
      let analysis = 'ANÁLISIS DETALLADO DE ENDPOINTS:\n\n';

      for (const api of apis) {
        const apiWithEndpoints = await this.apiManager.getAPI(api.id);
        
        analysis += `🔷 API: ${api.name} (${api.id})\n`;
        analysis += `📋 Descripción: ${api.description}\n`;
        analysis += `🌐 Base URL: ${api.baseUrl}\n`;
        analysis += `📊 Tipo: ${api.type}\n\n`;

        if (apiWithEndpoints?.endpoints && apiWithEndpoints.endpoints.length > 0) {
          analysis += `📋 ENDPOINTS DISPONIBLES:\n`;
          
          apiWithEndpoints.endpoints.forEach((endpoint, index) => {
            analysis += `\n${index + 1}. ${endpoint.method} ${endpoint.path}\n`;
            analysis += `   📝 Descripción: ${endpoint.description}\n`;
            
            if (endpoint.parameters && endpoint.parameters.length > 0) {
              analysis += `   ⚙️  Parámetros:\n`;
              endpoint.parameters.forEach(param => {
                analysis += `      • ${param.name} (${param.in})`;
                analysis += ` - Tipo: ${param.type}`;
                analysis += ` - ${param.required ? 'Requerido' : 'Opcional'}`;
                analysis += ` - Desc: ${param.description}\n`;
              });
            }
            
            if (endpoint.tags && endpoint.tags.length > 0) {
              analysis += `   🏷️  Tags: ${endpoint.tags.join(', ')}\n`;
            }
          });
        } else {
          analysis += `❌ No se pudieron descubrir endpoints para esta API\n`;
        }
        
        analysis += '\n' + '='.repeat(80) + '\n\n';
      }

      return analysis;
    } catch (error) {
      logger.error('Error generating endpoints analysis:', error);
      return 'No se pudo generar el análisis de endpoints.';
    }
  }

  async findRelevantEndpoints(question: string, model: IAModel = 'claude'): Promise<{
    endpoints: any[];
    analysis: string;
  }> {
    try {
      const allEndpoints = await this.getAllEndpoints();
      
      const prompt = `
Eres un especialista en descubrimiento de APIs. Encuentra los endpoints más relevantes para la pregunta del usuario.

ENDPOINTS DISPONIBLES:
${JSON.stringify(allEndpoints, null, 2)}

PREGUNTA: "${question}"

Responde SOLO con un JSON que contenga:
{
  "relevantEndpoints": [
    {
      "api": "nombre-api",
      "endpoint": "/ruta/endpoint",
      "method": "GET|POST|etc",
      "reason": "por qué es relevante",
      "confidence": 0.9
    }
  ]
}

No incluyas ningún otro texto.
      `;

      const aiService = iaFactory.createService(model);
      const response = await aiService.processMessage(prompt);

      // Parsear la respuesta JSON
      try {
        const result = JSON.parse(response);
        return {
          endpoints: result.relevantEndpoints || [],
          analysis: await this.generateEndpointUsageAnalysis(result.relevantEndpoints, question)
        };
      } catch (parseError) {
        logger.warn('La IA no devolvió JSON válido, usando análisis alternativo');
        return {
          endpoints: await this.findEndpointsByKeywords(question, allEndpoints),
          analysis: response
        };
      }
    } catch (error) {
      logger.error('Error finding relevant endpoints:', error);
      throw new Error(`Error al encontrar endpoints relevantes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  private async getAllEndpoints(): Promise<any[]> {
    const apis = await this.apiManager.getAllAPIs();
    const allEndpoints: any[] = [];

    for (const api of apis) {
      const apiWithEndpoints = await this.apiManager.getAPI(api.id);
      if (apiWithEndpoints?.endpoints) {
        apiWithEndpoints.endpoints.forEach(endpoint => {
          allEndpoints.push({
            api: api.id,
            apiName: api.name,
            baseUrl: api.baseUrl,
            ...endpoint
          });
        });
      }
    }

    return allEndpoints;
  }

  private async findEndpointsByKeywords(question: string, endpoints: any[]): Promise<any[]> {
    const keywords = question.toLowerCase().split(/\s+/);
    const relevantEndpoints = endpoints.filter(endpoint => {
      const searchText = `
        ${endpoint.path} ${endpoint.description} ${endpoint.method} 
        ${endpoint.api} ${endpoint.apiName}
      `.toLowerCase();

      return keywords.some(keyword => 
        searchText.includes(keyword) && keyword.length > 3
      );
    });

    return relevantEndpoints.slice(0, 5); // Limitar a 5 endpoints más relevantes
  }

  private async generateEndpointUsageAnalysis(endpoints: any[], question: string): Promise<string> {
    if (endpoints.length === 0) {
      return 'No se encontraron endpoints relevantes para tu pregunta.';
    }

    const prompt = `
Genera un análisis técnico detallado sobre cómo usar estos endpoints para resolver la pregunta del usuario.

ENDPOINTS RELEVANTES:
${JSON.stringify(endpoints, null, 2)}

PREGUNTA ORIGINAL: "${question}"

Proporciona:
1. Explicación técnica de cada endpoint relevante
2. Ejemplos de implementación práctica
3. Parámetros requeridos y cómo usarlos
4. Posibles respuestas y cómo manejarlas
5. Consideraciones de errores comunes
6. Mejores prácticas de implementación

Sé específico y técnico.
    `;

    const aiService = iaFactory.createService('claude');
    return await aiService.processMessage(prompt);
  }

  async processAPIQuestion(question: string, model: IAModel = 'claude'): Promise<string> {
    try {
      // Obtener información consolidada de todas las APIs
      const apiInfo = await this.apiManager.getConsolidatedAPIInfo();
      
      const prompt = `
Eres un asistente especializado en APIs. Responde la pregunta del usuario basándote en la información de las APIs disponibles.

INFORMACIÓN DE APIS DISPONIBLES:
${apiInfo}

PREGUNTA DEL USUARIO: ${question}

Responde de manera técnica y específica, incluyendo ejemplos de endpoints cuando sea relevante.
Proporciona información precisa sobre los endpoints disponibles, parámetros requeridos y ejemplos de uso.
      `;

      // Usar el servicio de IA seleccionado
      const aiService = iaFactory.createService(model);
      const answer = await aiService.processMessage(prompt);

      return answer;
    } catch (error) {
      logger.error('Error procesando pregunta de API:', error);
      throw new Error(`Error al procesar la pregunta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async getAPISummary(model: IAModel = 'claude'): Promise<string> {
    try {
      const apiInfo = await this.apiManager.getConsolidatedAPIInfo();
      
      const prompt = `
Eres un asistente especializado en APIs. Proporciona un resumen ejecutivo de las APIs disponibles.

INFORMACIÓN DE APIS DISPONIBLES:
${apiInfo}

Genera un resumen que incluya:
1. Número total de APIs disponibles
2. Breve descripción de cada API
3. Principales capacidades de cada API
4. Endpoints más importantes
5. Recomendaciones de uso

El resumen debe ser claro, conciso y útil para desarrolladores.
      `;

      const aiService = iaFactory.createService(model);
      const summary = await aiService.processMessage(prompt);

      return summary;
    } catch (error) {
      logger.error('Error generando resumen de APIs:', error);
      throw new Error(`Error al generar resumen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}