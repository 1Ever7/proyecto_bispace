import axios from 'axios';
import { AIService, AIServiceOptions, ChatMessage } from './ia.interface';
import { iaConfig } from '../../config/ia.config';
import { logger } from '../../utils/logger';

export class ClaudeService implements AIService {
  private readonly apiUrl = 'https://api.anthropic.com/v1/messages';
  private readonly version = '2023-06-01';

  private getApiKey(): string {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY no configurada');
    }
    return apiKey;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.getApiKey(), // CAMBIO PRINCIPAL: usar x-api-key en lugar de Authorization
      'anthropic-version': this.version, // CAMBIO: minúsculas en el header
      'User-Agent': 'API-Assistant/1.0'
    };
  }

  async processMessage(prompt: string, options?: AIServiceOptions): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: options?.model || 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7,
          system: 'Eres un asistente útil especializado en APIs.'
        },
        {
          headers: this.getHeaders(),
          timeout: 30000
        }
      );

      return response.data.content[0]?.text || '';
    } catch (error: any) {
      console.error('Error Claude API:', error.response?.data || error.message);
      throw new Error(`Claude API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async processChat(messages: ChatMessage[], options?: AIServiceOptions): Promise<string> {
    try {
      const claudeMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      const response = await axios.post(
        this.apiUrl,
        {
          model: options?.model || 'claude-3-5-sonnet-20240620',
          messages: claudeMessages,
          max_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7
        },
        {
          headers: this.getHeaders(),
          timeout: 30000
        }
      );

      return response.data.content[0]?.text || '';
    } catch (error: any) {
      console.error('Error Claude API:', error.response?.data || error.message);
      throw new Error(`Claude API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async analyzeQuery(query: string): Promise<any> {
    const prompt = `
Analiza la siguiente consulta técnica sobre APIs y devuelve un JSON con el análisis:

Consulta: "${query}"

Responde SOLO con JSON en este formato:
{
  "intent": "query|count|create|update|delete|documentation",
  "targetEntity": "usuarios|activos|etc",
  "targetAPI": "sabi|rh|etc",
  "parameters": {"key": "value"},
  "confidence": 0.95,
  "suggestedEndpoints": ["/endpoint1", "/endpoint2"]
}
    `;

    try {
      const response = await this.processMessage(prompt, { temperature: 0.1 });
      return JSON.parse(response);
    } catch (error) {
      logger.warn('Error parsing Claude analysis, using fallback');
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