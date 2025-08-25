import { IAModel } from '../../config/ia.config';
import { AIService } from './ia.interface';
import { ClaudeService } from './claude.service';
import { GeminiService } from './gemini.service';

export const iaFactory = {
  createService(model: IAModel): AIService {
    switch (model.toLowerCase()) {
      case 'claude':
        return new ClaudeService();
      case 'gemini':
        return new GeminiService();
      default:
        throw new Error(`Modelo de IA no soportado: ${model}. Solo se admite 'claude' o 'gemini'`);
    }
  },

  createServiceWithOptions(options: { model: IAModel } & Record<string, any>): AIService {
    const service = this.createService(options.model);
    return service;
  }
};

export function isAIService(obj: any): obj is AIService {
  return obj && 
         typeof obj.processMessage === 'function' && 
         typeof obj.processChat === 'function';
}