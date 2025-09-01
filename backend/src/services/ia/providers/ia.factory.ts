import { AIProvider, AIModel } from './ia.interface';
import { ClaudeService } from './claude.service';
import { GeminiService } from './gemini.service';
import { logger } from '../../../utils/logger';

export class AIFactory {
  static createProvider(model: AIModel): AIProvider {
    try {
      switch (model) {
        case 'claude':
          return new ClaudeService();
        case 'gemini':
          return new GeminiService();
        default:
          throw new Error(`Modelo de IA no soportado: ${model}`);
      }
    } catch (error) {
      logger.error(`Error creando proveedor para modelo ${model}:`, error);
      
      // Fallback a Gemini si Claude falla
      if (model === 'claude') {
        logger.warn('Usando Gemini como fallback debido a error en Claude');
        return new GeminiService();
      }
      
      throw new Error(`No se pudo crear proveedor de IA: ${error}`);
    }
  }
}