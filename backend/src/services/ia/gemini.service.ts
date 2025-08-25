// src/services/ia/gemini.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService, AIServiceOptions, ChatMessage } from './ia.interface';
import { iaConfig } from '../../config/ia.config';
import { logger } from '../../utils/logger';


export class GeminiService implements AIService {
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(iaConfig.gemini.apiKey);
  }

  async processMessage(prompt: string, options?: AIServiceOptions): Promise<string> {
    return this.processChat([{ role: 'user', content: prompt }], options);
  }

  async processChat(messages: ChatMessage[], options?: AIServiceOptions): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: options?.model || 'gemini-1.5-pro-latest',
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 1024
        }
      });

      const chat = model.startChat({
        history: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      });

      const lastMessage = messages[messages.length - 1]?.content || '';
      const result = await chat.sendMessage(lastMessage);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Error Gemini API:', error);
      throw new Error(`Gemini API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

 async analyzeQuery(query: string): Promise<any> {
    const prompt = `
Analiza esta consulta técnica y devuelve SOLO JSON sin otro texto:

Consulta: "${query}"

Formato JSON requerido:
{
  "intent": "query|count|create|update|delete|documentation",
  "targetEntity": "string",
  "targetAPI": "string", 
  "parameters": {},
  "confidence": 0.95,
  "suggestedEndpoints": []
}
    `;

    try {
      const response = await this.processMessage(prompt, { 
        temperature: 0.1,
        maxTokens: 500
      });
      
      // Gemini a veces añade texto alrededor del JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(response);
    } catch (error) {
      logger.warn('Error parsing Gemini analysis, using fallback');
      return {
        intent: 'query',
        targetEntity: '',
        targetAPI: '',
        parameters: {},
        confidence: 0.5,
        suggestedEndpoints: []
      };
    }
  }

}