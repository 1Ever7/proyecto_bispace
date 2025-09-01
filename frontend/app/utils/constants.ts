export const AI_MODELS = {
  CLAUDE: 'claude',
  GEMINI: 'gemini'
} as const;

export const API_HEALTH_STATUS = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
} as const;

export const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  CHAT_HISTORY: 'chat_history',
  SELECTED_MODEL: 'selected_model',
  SELECTED_API: 'selected_api'
} as const;