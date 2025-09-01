export const Constants = {
  // Tiempos de espera
  DEFAULT_API_TIMEOUT: 30000,
  HEALTH_CHECK_INTERVAL: 60000,
  
  // Límites
  MAX_REQUEST_SIZE: '10mb',
  MAX_REQUESTS_PER_MINUTE: 100,
  
  // Estados
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending'
  },
  
  // Tipos de respuesta
  RESPONSE_TYPE: {
    LIST: 'list',
    COUNT: 'count',
    DETAIL: 'detail'
  },
  
  // Modelos de IA
  AI_MODELS: {
    CLAUDE: 'claude',
    GEMINI: 'gemini',
    GPT: 'gpt'
  }
};

export const ErrorMessages = {
  API_NOT_FOUND: 'API no encontrada',
  INVALID_REQUEST: 'Solicitud inválida',
  TIMEOUT_ERROR: 'Tiempo de espera agotado',
  RATE_LIMIT_EXCEEDED: 'Límite de tasa excedido'
};

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export async function scrapeWebPage(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error al acceder a la página: ${res.statusText}`);
    
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extraer solo texto visible del body
    const text = $('body').text();
    // Limpiar saltos de línea y espacios extra
    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Error scrapeWebPage:', error);
    return '';
  }
}
