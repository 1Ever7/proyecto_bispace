export type AIModel = 'claude' | 'gemini' | 'gpt';

export interface AIProvider {
  sendMessage(message: string): Promise<string>;
  getModel(): string;
}