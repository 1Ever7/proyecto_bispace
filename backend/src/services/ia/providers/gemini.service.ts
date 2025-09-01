// src/services/ia/providers/gemini.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './ia.interface';
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

export class GeminiService implements AIProvider {
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }



  async sendMessage(message: string, sourceUrl?: string): Promise<string> {
    try {
   // 1 Obtener contenido web si se proporcionó URL
    let context = 'https://bispace.site/nosotros/';
    if (sourceUrl) {
      context = await scrapeWebPage(sourceUrl);
    }

        // 2 Construir prompt
    const prompt = context
      ? `Usa la siguiente información para responder la pregunta: ${context}\nPregunta: ${message}`
      : message;


        // 3️⃣ Pasar prompt al chat para que lo use
    return await this.processChat([{ role: 'user', content: prompt }]);

      console.log('📤 Enviando mensaje a Gemini...');
      return await this.processChat([{ role: 'user', content: message }]);
    } catch (error) {
      logger.error('Error en sendMessage:', error);
      throw new Error(`Error comunicándose con Gemini: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async processChat(messages: Array<{ role: string; content: string }>, options?: any): Promise<string> {
    try {
      // ✅ USAR MODELOS CORRECTOS
      const modelName = options?.model || 'gemini-1.5-pro-latest'; 
      
      console.log('🤖 Usando modelo:', modelName);
      
      const model = this.genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 1024
        }
      });

      // Para chat, usar startChat
      const chat = model.startChat({
        history: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      });

      const lastMessage = messages[messages.length - 1]?.content || '';
      const result = await chat.sendMessage(lastMessage);
      const response = await result.response;
      
      console.log('✅ Respuesta recibida de Gemini');
      return response.text();
    } catch (error: any) {
      console.error('❌ Error detallado de Gemini API:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText
      });
      
      // Sugerencia de modelos disponibles
      if (error.message.includes('not found')) {
        console.log('💡 Modelos disponibles: gemini-1.0-pro, gemini-1.5-pro-latest');
      }
      
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }

  // Método alternativo simple para mensajes únicos
  async sendSimpleMessage(message: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.0-pro',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      });

      const result = await model.generateContent(message);
      const response = await result.response;
      
      return response.text();
    } catch (error: any) {
      console.error('Error en sendSimpleMessage:', error.message);
      throw error;
    }
  }

  getModel(): string {
    return 'gemini';
  }
}