import { AIProvider } from './ia.interface';
import { aiModels } from '../../../config/ia.config';
import { logger } from '../../../utils/logger';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';


// Función para obtener texto de una página web
async function scrapeWebPage(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error al acceder a la página: ${res.statusText}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    return $('body').text().replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Error scrapeWebPage:', error);
    return '';
  }
}

// Función para respuestas fijas

export class ClaudeService implements AIProvider {
  private modelConfig = aiModels.claude;

  constructor() {
    if (!this.modelConfig.apiKey) throw new Error('Claude API key no configurada');
  }

  // Mensaje con contexto opcional de URL
  async sendMessage(message: string, sourceUrl?: string): Promise<string> {
 
    // 1 Obtener contenido web si se proporcionó URL
    let context = 'https://bispace.site/nosotros/';
    if (sourceUrl) {
      context = await scrapeWebPage(sourceUrl);
    }

    // 2 Construir prompt
    const prompt = context
      ? `Usa la siguiente información para responder la pregunta: ${context}\nPregunta: ${message}`
      : message;

    // 4️⃣ Llamada a Claude API
    const requestBody = {
      model: 'claude-3-haiku-20240307',
      max_tokens: this.modelConfig.maxTokens,
      temperature: this.modelConfig.temperature,
      messages: [{ role: 'user', content: prompt }]
    };

    try {
      const response = await fetch(this.modelConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.modelConfig.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${JSON.stringify(errData)}`);
      }

      const data: any = await response.json();
      const text = data?.content?.[0]?.text;
      if (!text) throw new Error('Formato de respuesta inválido de Claude API');

      return text;
    } catch (error: any) {
      logger.error('Error en Claude sendMessage:', error);
      throw error;
    }
  }

  getModel(): string {
    return this.modelConfig.id;
  }
}
