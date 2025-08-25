// src/controllers/chat.controller.ts
import { Request, Response } from 'express';
import { iaFactory } from '../services/ia/ia.factory';
import { APIManager } from '../services/api/apiManager';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api.types';
import { IAModel } from '../config/ia.config';

// ✅ Usar logger en lugar de safeLog
const apiManager = new APIManager();

// Clase principal del controlador multisistema
export class ChatController {
// Método principal para manejar preguntas de múltiples APIs
handleApiQuestion = async (req: Request, res: Response) => {
  try {
    const { question, model = 'claude', targetAPI, apiId } = req.body;

    if (typeof question !== 'string' || !question.trim()) {
      const response: APIResponse = {
        success: false,
        error: 'Parámetro "question" requerido',
        message: 'Debe proporcionar una pregunta válida',
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    logger.info(`Procesando pregunta: "${question}" con modelo: ${model}, apiId: ${apiId || 'auto'}`);

    // Obtener todas las APIs disponibles
    const allAPIs = await apiManager.getAllAPIs();
    logger.info(`APIs disponibles: ${allAPIs.map(api => api.id).join(', ')}`);
    
    // Determinar qué API(s) usar basado en la pregunta, parámetro targetAPI o apiId específico
    const relevantAPIs = this.determineRelevantAPIs(question, targetAPI || apiId, allAPIs);
    logger.info(`APIs relevantes: ${relevantAPIs.map(api => api.id).join(', ')}`);
    
    // Obtener datos reales y contexto de las APIs relevantes
    const { context, usedAPIs } = await this.getDataFromRelevantAPIs(question, relevantAPIs);

    const prompt = this.buildMultisystemPrompt(question, context, allAPIs, relevantAPIs);
    const aiService = iaFactory.createService(model as IAModel);
    const answer = await aiService.processMessage(prompt);

    const processedAnswer = this.processAIAnswer(answer, question);

    const response: APIResponse = {
      success: true,
      data: { 
        answer: processedAnswer,
        context: context ? `Con datos de: ${usedAPIs.join(', ')}` : 'Modo informativo',
        relevantAPIs: relevantAPIs.map(api => api.id),
        availableAPIs: allAPIs.map(api => ({ id: api.id, name: api.name })),
        specifiedAPI: apiId || targetAPI || 'auto-detectada'
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    logger.error('Error en chatController:', error);
    const response: APIResponse = {
      success: false,
      error: 'Error procesando pregunta',
      message: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
};

  
// Determinar qué APIs son relevantes para la pregunta
private determineRelevantAPIs(question: string, targetAPI: string | undefined, allAPIs: any[]) {
  const lowerQuestion = question.toLowerCase();
  
  // Si se especifica una API específica (targetAPI o apiId)
  if (targetAPI) {
    const specificAPI = allAPIs.find(api => api.id === targetAPI);
    if (specificAPI) {
      logger.info(`API específica solicitada: ${targetAPI}`);
      return [specificAPI];
    } else {
      logger.warn(`API solicitada no encontrada: ${targetAPI}, usando detección automática`);
    }
  }

  // Detectar APIs basado en palabras clave
  const relevantAPIs = allAPIs.filter(api => {
    const apiKeywords = this.getAPIKeywords(api);
    return apiKeywords.some(keyword => lowerQuestion.includes(keyword));
  });

  // Si no se detecta ninguna API específica, usar todas
  return relevantAPIs.length > 0 ? relevantAPIs : allAPIs;
}



// Palabras clave para cada API - ACTUALIZADO con términos de cantidad
private getAPIKeywords(api: any): string[] {
  const keywordsMap: { [key: string]: string[] } = {
    'sabi': [
      'usuario', 'user', 'activo', 'asset', 'sabi', 'gestión', 'empresa', 
      'activo', 'usr', 'activo', 'cantidad', 'total', 'marcas', 'uso', 
      'baja', 'mantenimiento', 'disponible', 'depreciado', 'revalorizado', 
      'edificio', 'req_mantenimiento', 'estadística', 'consulta', 'contar',
      'cuántos', 'cuántas', 'número'
    ],
    'trendvoto': [
      'trendvoto', 'geo', 'geoportal', 'electoral', 'elecciones', 'votos', 'resultados',
      'delegado', 'recinto', 'municipio', 'circunscripción', 'mesa', 'acta', 'estado',
      'provincia', 'distrito', 'sección', 'colonia', 'ciudad', 'comunidad', 'zona',
      'votación', 'censo', 'padrón', 'elector', 'sufragio', 'urna', 'escritinio',
      'estadística', 'mapa', 'geográfico', 'territorio', 'demarcación'
    ]
  };

  return keywordsMap[api.id] || [api.id, api.name.toLowerCase()];
}

// Obtener datos de las APIs relevantes
private async getDataFromRelevantAPIs(question: string, relevantAPIs: any[]) {
  let context = '';
  const usedAPIs: string[] = [];

  for (const api of relevantAPIs) {
    try {
      logger.info(`Intentando obtener datos de API: ${api.id}`);
      
      const apiData = await this.queryAPIForQuestion(api, question);
      if (apiData) {
        context += `=== DATOS DE ${api.name.toUpperCase()} ===\n`;
        context += `${apiData}\n\n`;
        usedAPIs.push(api.id);
      }
    } catch (error) {
      logger.warn(`No se pudieron obtener datos de ${api.id}:`, error);
      // Continuar con la siguiente API
    }
  }

  return { context, usedAPIs };
}

// Consultar API específica basado en la pregunta - ACTUALIZADO con endpoints de cantidad
private async queryAPIForQuestion(api: any, question: string): Promise<string | null> {
  const lowerQuestion = question.toLowerCase();
  let endpointData = '';

  try {
    // Para la API Sabi, intentar consultar endpoints específicos
    if (api.id === 'sabi') {
      if (/usuario|user|usr/i.test(lowerQuestion)) {
        try {
          const data = await apiManager.queryAPI(api.id, '/usr', {});
          endpointData += this.formatListResponse(data, 'usuario');
        } catch (error) {
          endpointData += `No se pudo obtener la lista de usuarios.\n`;
        }
      }

      if (/activo|asset/i.test(lowerQuestion)) {
        try {
          const data = await apiManager.queryAPI(api.id, '/activo', {});
          endpointData += this.formatListResponse(data, 'activo');
        } catch (error) {
          endpointData += `No se pudo obtener la lista de activos.\n`;
        }
      }

      // NUEVO: Consultas de cantidad
      if (/cantidad|total|cuántos|cuántas|marcas|uso|baja|mantenimiento|disponible|depreciado|revalorizado|edificio|req_mantenimiento/i.test(lowerQuestion)) {
        // Mapeo de palabras clave a endpoints de cantidad
        const cantidadEndpoints: { [key: string]: string } = {
          'marca': '/cantidad/marcas',
          'marcas': '/cantidad/marcas',
          'uso': '/cantidad/uso',
          'baja': '/cantidad/baja',
          'mantenimiento': '/cantidad/mantenimiento',
          'disponible': '/cantidad/disponible',
          'depreciado': '/cantidad/depreciados',
          'revalorizado': '/cantidad/revalorizados',
          'edificio': '/cantidad/edificios',
          'edificios': '/cantidad/edificios',
          'req_mantenimiento': '/cantidad/req_mantenimiento',
          'requiere mantenimiento': '/cantidad/req_mantenimiento',
          'mantenimiento requerido': '/cantidad/req_mantenimiento'
        };

        // Por defecto, si solo dice cantidad, usar el endpoint general de cantidad
        let endpointPath = '/cantidad';

        // Buscar la palabra clave más específica
        for (const [keyword, path] of Object.entries(cantidadEndpoints)) {
          if (lowerQuestion.includes(keyword)) {
            endpointPath = path;
            break;
          }
        }

        try {
          const data = await apiManager.queryAPI(api.id, endpointPath, {});
          // Formatear la respuesta de cantidad
          endpointData += this.formatCantidadResponse(data, endpointPath);
        } catch (error) {
          endpointData += `No se pudo obtener la cantidad solicitada.\n`;
        }
      }
    } else if (api.id === 'trendvoto') {
      // Consultas geo-electorales
      if (/estado|departamento|depto/i.test(lowerQuestion)) {
        try {
          const data = await apiManager.queryAPI(api.id, '/geo/buscarEstado', {});
          endpointData += this.formatListResponse(data, 'estado');
        } catch (error) {
          endpointData += `No se pudo obtener la lista de estados.\n`;
        }
      }

      if (/municipio|muni/i.test(lowerQuestion)) {
        try {
          const data = await apiManager.queryAPI(api.id, '/geo/listarMunicipios/0', {});
          endpointData += this.formatListResponse(data, 'municipio');
        } catch (error) {
          endpointData += `No se pudo obtener la lista de municipios.\n`;
        }
      }

      if (/recinto|centro.*votación/i.test(lowerQuestion)) {
        try {
          const data = await apiManager.queryAPI(api.id, '/geo/getRecintos', {});
          endpointData += this.formatListResponse(data, 'recinto');
        } catch (error) {
          endpointData += `No se pudo obtener la lista de recintos.\n`;
        }
      }

      if (/mesa|votación/i.test(lowerQuestion)) {
        try {
          const data = await apiManager.queryAPI(api.id, '/geo/listarMesas/0/0', {});
          endpointData += this.formatListResponse(data, 'mesa');
        } catch (error) {
          endpointData += `No se pudo obtener la lista de mesas.\n`;
        }
      }

      // Consultas de resultados electorales
      if (/resultado|voto|escrutinio/i.test(lowerQuestion)) {
        try {
          const data = await apiManager.queryAPI(api.id, '/resultados/getResultados', {});
          endpointData += this.formatListResponse(data, 'resultado electoral');
        } catch (error) {
          endpointData += `No se pudo obtener los resultados electorales.\n`;
        }
      }

      // Consultas de geoportal
      if (/estadística|mapa|geográfico/i.test(lowerQuestion)) {
        try {
          const data = await apiManager.queryAPI(api.id, '/geoportal/datosEstadisticosGeneral/2023', {});
          endpointData += this.formatListResponse(data, 'estadística');
        } catch (error) {
          endpointData += `No se pudo obtener las estadísticas.\n`;
        }
      }
    }
    
    //agregar nueva funcion



    // Si no hay endpoints específicos, obtener información general
    if (!endpointData) {
      const apiInfo = await apiManager.getAPI(api.id);
      endpointData = `**${apiInfo?.name}**\n`;
      endpointData += `- URL: ${apiInfo?.baseUrl}\n`;
      endpointData += `- Descripción: ${apiInfo?.description}\n`;
      
      // Agregar endpoints disponibles
      if (apiInfo?.endpoints && apiInfo.endpoints.length > 0) {
        endpointData += `- Endpoints disponibles: ${apiInfo.endpoints.slice(0, 3).map(e => e.path).join(', ')}`;
        if (apiInfo.endpoints.length > 3) {
          endpointData += `, ... (+${apiInfo.endpoints.length - 3} más)`;
        }
      }
    }


    return endpointData;

  } catch (error) {
    logger.warn(`Error consultando API ${api.id}:`, error);
    return `Información general de ${api.name}: ${api.description}`;
  }




}

// NUEVA FUNCIÓN: Formatear respuesta de endpoints de cantidad
// FUNCIÓN MEJORADA: Formatear respuesta de endpoints de cantidad
private formatCantidadResponse(data: any, endpointPath: string): string {
  let response = '';

  // Determinar el tipo de endpoint y formatear acorde
  const endpointType = endpointPath.replace('/cantidad/', '');
  
  switch (endpointType) {
    case 'marcas':
      if (data.marcas && Array.isArray(data.marcas)) {
        response += '**Cantidad de activos por marca:**\n\n';
        data.marcas.forEach((marca: any, index: number) => {
          response += `${index + 1}. **${marca.marca}**\n`;
          response += `   - Categoría: ${marca.categoria}\n`;
          response += `   - Subcategoría: ${marca.subcategoria}\n`;
          response += `   - Cantidad: ${marca.cantidad} activos\n`;
          
          if (marca.modelos && marca.modelos.length > 0) {
            response += `   - Modelos: ${marca.modelos.slice(0, 3).join(', ')}`;
            if (marca.modelos.length > 3) {
              response += `, ... (+${marca.modelos.length - 3} más)`;
            }
            response += '\n';
          }
          response += '\n';
        });
        response += `**Total de marcas diferentes:** ${data.marcas.length}\n`;
      }
      break;
      
    case 'edificios':
      if (data.edificios && Array.isArray(data.edificios)) {
        response += '**Cantidad de activos por edificio:**\n\n';
        data.edificios.forEach((edificio: any, index: number) => {
          response += `${index + 1}. **${edificio.nombre || edificio.edificio}**\n`;
          response += `   - Cantidad: ${edificio.cantidad} activos\n`;
          response += `   - Ubicación: ${edificio.ubicacion || 'N/A'}\n`;
          response += '\n';
        });
      }
      break;
      
    case 'depreciados':
    case 'revalorizados':
      // Para endpoints que devuelven una lista de activos
      if (Array.isArray(data)) {
        response += `**${endpointType.charAt(0).toUpperCase() + endpointType.slice(1)}:**\n\n`;
        data.forEach((item: any, index: number) => {
          response += `${index + 1}. ${item.nombre || item.descripcion || 'Activo'} - Cantidad: ${item.cantidad || 1}\n`;
        });
        response += `\n**Total: ${data.length} elementos**\n`;
      } else if (typeof data === 'object' && data.cantidad !== undefined) {
        response += `Cantidad de ${endpointType}: ${data.cantidad}\n`;
      }
      break;
      
    case 'req_mantenimiento':
      // Para el endpoint de requerimiento de mantenimiento (número de severidad)
      if (typeof data === 'number') {
        response += `**Nivel de requerimiento de mantenimiento:** ${data}\n\n`;
        
        // Interpretar el nivel de severidad
        if (data === 0) {
          response += `✅ **Estado óptimo**: No hay activos que requieran mantenimiento urgente.\n`;
        } else if (data <= 3) {
          response += `⚠️ **Nivel bajo**: ${data} activo(s) requieren mantenimiento. Situación manejable.\n`;
        } else if (data <= 7) {
          response += `⚠️⚠️ **Nivel medio**: ${data} activo(s) requieren mantenimiento. Se recomienda planificar intervenciones.\n`;
        } else if (data <= 10) {
          response += `🚨 **Nivel alto**: ${data} activo(s) requieren mantenimiento. Atención prioritaria necesaria.\n`;
        } else {
          response += `🔥 **Nivel crítico**: ${data} activo(s) requieren mantenimiento. Situación de emergencia.\n`;
        }
      } else if (typeof data === 'object' && data.cantidad !== undefined) {
        // Si viene en formato objeto con propiedad cantidad
        const cantidad = data.cantidad;
        response += `**Activos que requieren mantenimiento:** ${cantidad}\n\n`;
        
        if (cantidad === 0) {
          response += `✅ **Estado óptimo**: No hay activos que requieran mantenimiento.\n`;
        } else {
          response += `⚠️ **Atención necesaria**: ${cantidad} activo(s) requieren mantenimiento.\n`;
        }
      } else if (Array.isArray(data)) {
        // Si es una lista de activos que requieren mantenimiento
        response += `**Activos que requieren mantenimiento:** ${data.length}\n\n`;
        data.slice(0, 5).forEach((activo: any, index: number) => {
          response += `${index + 1}. ${activo.nombre || activo.descripcion || 'Activo'}\n`;
          if (activo.ubicacion) response += `   - Ubicación: ${activo.ubicacion}\n`;
          if (activo.prioridad) response += `   - Prioridad: ${activo.prioridad}\n`;
          response += '\n';
        });
        if (data.length > 5) {
          response += `... y ${data.length - 5} más\n`;
        }
      }
      break;
      
    case 'uso':
    case 'baja':
    case 'mantenimiento':
    case 'disponible':
      // Para endpoints que devuelven un número simple
      if (typeof data === 'number') {
        response += `Cantidad de activos ${endpointType}: ${data}\n`;
      } else if (typeof data === 'object' && data.cantidad !== undefined) {
        response += `Cantidad de activos ${endpointType}: ${data.cantidad}\n`;
      }
      break;
      
    default:
      // Para el endpoint general /cantidad o cualquier otro no especificado
      if (typeof data === 'number') {
        response += `Cantidad total: ${data}\n`;
      } else if (typeof data === 'object') {
        response += `Datos de ${endpointPath}:\n`;
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            response += `${key}: ${value.length} elementos\n`;
          } else {
            response += `${key}: ${value}\n`;
          }
        }
      } else {
        response += `${data}\n`;
      }
  }

  return response;
}
  


 // En src/controllers/chat.controller.ts, modifica el método buildMultisystemPrompt
private buildMultisystemPrompt(question: string, context: string, allAPIs: any[], relevantAPIs: any[]): string {
    const availableSystems = allAPIs.map(api => 
      `- ${api.id}: ${api.name} (${api.baseUrl}) - ${api.description}`
    ).join('\n');

    const targetSystems = relevantAPIs.map(api => api.id).join(', ');
    
    // Detectar el tipo de pregunta para ajustar el prompt
    const lowerQuestion = question.toLowerCase();
    let specificityInstruction = '';
    
    if (lowerQuestion.includes('listame') || lowerQuestion.includes('muestrame') || 
        lowerQuestion.includes('enumera') || lowerQuestion.includes('dame')) {
      specificityInstruction = 'Responde de manera CONCISA y DIRECTA. Proporciona principalmente los datos solicitados con formato claro (tablas, listas). Evita explicaciones extensas.';
    } else if (lowerQuestion.includes('cómo') || lowerQuestion.includes('como') || 
               lowerQuestion.includes('explica') || lowerQuestion.includes('qué')) {
      specificityInstruction = 'Responde de manera técnica pero concisa. Enfócate en la información práctica.';
    } else {
      specificityInstruction = 'Responde de manera técnica y específica, pero evita explicaciones innecesariamente extensas.';
    }

    return `
Eres un asistente especializado en múltiples sistemas empresariales. 
${specificityInstruction}

SISTEMAS DISPONIBLES:
${availableSystems}

CONTEXTO Y DATOS OBTENIDOS:
${context || 'No se pudieron obtener datos en tiempo real.'}

PREGUNTA DEL USUARIO: ${question}

Sistemas objetivo: ${targetSystems}

Si la pregunta es un listado, presenta los datos en formato de tabla o lista clara.
Si es una pregunta técnica, enfócate en los aspectos prácticos.
`;
  }

  // Método para obtener resumen de todos los sistemas
  async getSystemsSummary(req: Request, res: Response) {
    try {
      const { model = 'claude' } = req.body;
      
      const allAPIs = await apiManager.getAllAPIs();
      const aiService = iaFactory.createService(model as IAModel);
      
      const prompt = `
Eres un arquitecto de sistemas. Proporciona un resumen ejecutivo de todos los sistemas disponibles:

SISTEMAS:
${allAPIs.map(api => 
  `- ${api.id}: ${api.name}
   URL: ${api.baseUrl}
   Descripción: ${api.description}
   Tipo: ${api.type}
   Endpoints: ${api.endpoints?.length || 0} descubiertos`
).join('\n\n')}

Genera un resumen que incluya:
1. Capacidades principales de cada sistema
2. Posibles integraciones entre sistemas
3. Casos de uso recomendados para cada uno
4. Arquitectura general recomendada
5. Consideraciones técnicas importantes
      `;

      const summary = await aiService.processMessage(prompt);
      
      const response: APIResponse = {
        success: true,
        data: { 
          summary,
          totalSystems: allAPIs.length,
          systems: allAPIs.map(api => ({ id: api.id, name: api.name }))
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      logger.error('Error obteniendo resumen de sistemas:', error);
      const response: APIResponse = {
        success: false,
        error: 'Error generando resumen',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

// En src/controllers/chat.controller.ts, agrega este método
private formatListResponse(rawData: any, entityType: string): string {
  try {
    if (!rawData) return `No se encontraron datos de ${entityType}.`;
    
    // Intentar encontrar el array de datos
    let dataArray = rawData;
    if (Array.isArray(rawData)) {
      dataArray = rawData;
    } else if (rawData.data && Array.isArray(rawData.data)) {
      dataArray = rawData.data;
    } else if (rawData[entityType + 's'] && Array.isArray(rawData[entityType + 's'])) {
      dataArray = rawData[entityType + 's'];
    } else if (rawData[entityType] && Array.isArray(rawData[entityType])) {
      dataArray = rawData[entityType];
    }
    
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return `No se encontraron ${entityType}s.`;
    }
    
    // Obtener las columnas disponibles (usar las primeras 5 propiedades como máximo)
    const sampleItem = dataArray[0];
    const columns = Object.keys(sampleItem).slice(0, 5);
    
    // Crear tabla Markdown
    let table = `## Lista de ${entityType}s\n\n`;
    table += `| ${columns.join(' | ')} |\n`;
    table += `| ${columns.map(() => '---').join(' | ')} |\n`;
    
    // Agregar filas (limitar a 10 filas para no saturar)
    dataArray.slice(0, 10).forEach((item: any) => {
      const row = columns.map(col => {
        const value = item[col];
        return value !== null && value !== undefined ? String(value).substring(0, 30) : 'N/A';
      }).join(' | ');
      table += `| ${row} |\n`;
    });
    
    if (dataArray.length > 10) {
      table += `\n*Mostrando 10 de ${dataArray.length} ${entityType}s. Use filtros para ver más.*`;
    }
    
    return table;
  } catch (error) {
    logger.warn('Error formateando respuesta de listado:', error);
    return `Datos de ${entityType}s: ${JSON.stringify(rawData, null, 2).substring(0, 500)}...`;
  }
}

private processAIAnswer(answer: string, question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  // Para preguntas de listado, extraer solo la parte tabular si existe
  if (lowerQuestion.includes('listame') || lowerQuestion.includes('muestrame') || 
      lowerQuestion.includes('enumera') || lowerQuestion.includes('dame')) {
    // Buscar tablas Markdown en la respuesta
    const tableMatch = answer.match(/\|(.+\n\|.+\n(\|.+\n)+)/);
    if (tableMatch) {
      return tableMatch[0];
    }
    
    // Buscar listas
    const listMatch = answer.match(/((-|\d+\.\s).+(\n(-|\d+\.\s).+)*)/);
    if (listMatch) {
      return listMatch[0];
    }
    
    // Si no encuentra formato estructurado, devolver los primeros 500 caracteres
    return answer.substring(0, 5000) + (answer.length > 5000 ? '...' : '');
  }
  
  // Para otras preguntas, devolver la respuesta completa pero limitada
  return answer.length > 1000 ? answer.substring(0, 1000) + '...' : answer;
}

}

// Exportar instancia para las rutas
export const chatController = new ChatController();