import dotenv from 'dotenv';
dotenv.config();

export const iaConfig = {
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    defaultModel: 'claude-3-5-sonnet-20240620'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    defaultModel: 'gemini-1.5-pro-latest'
  }
};

export type IAModel = 'claude' | 'gemini';