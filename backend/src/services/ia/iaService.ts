import { AIProvider, AIModel } from './providers/ia.interface';
import { AIFactory } from './providers/ia.factory';
import { logger } from '../../utils/logger';
import { Constants } from '../../config/constants';

export class AIService {
  private provider: AIProvider;

  constructor(model: string = Constants.AI_MODELS.CLAUDE) {
    this.provider = AIFactory.createProvider(model as AIModel);
  }

  async processMessage(message: string, context: any = null, model?: string): Promise<string> {
    if (model && model !== this.getCurrentModel()) {
      this.setModel(model);
    }

    try {
      const enrichedMessage = this.enrichMessageWithContext(message, context);
      return await this.provider.sendMessage(enrichedMessage);
    } catch (error) {
      logger.error('Error procesando mensaje con IA:', error);
      throw new Error(`Error en servicio de IA: ${error}`);
    }
  }

  setModel(model: string): void {
    this.provider = AIFactory.createProvider(model as AIModel);
    logger.info(`Modelo de IA cambiado a: ${model}`);
  }

  getCurrentModel(): string {
    return this.provider.getModel();
  }

  private enrichMessageWithContext(message: string, context: any): string {
    if (!context) return message;

    return `
Mensaje: ${message}

Contexto adicional:
${JSON.stringify(context, null, 2)}

Por favor, responde al mensaje considerando el contexto proporcionado.
La respuesta debe ser clara y concisa.
La respuesta debe estar en el mismo idioma del mensaje original.
Evita respuestas genéricas como "No tengo información suficiente".
Confirma si necesitas más detalles sobre el contexto.
Mantén la confidencialidad de cualquier dato sensible en el contexto.
`;
  }
}