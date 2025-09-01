// src/config/config.ts
export class Config {
  static getPort(): number {
    return parseInt(process.env.MCP_PORT || '3003');
  }

  static getServerConfig() {
    return {
      name: process.env.MCP_SERVER_NAME || 'bispace',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
      capabilities: {
        resources: true,
        tools: true,
        logging: true
      }
    };
  }

  static getLogLevel(): string {
    return process.env.MCP_LOG_LEVEL || 'info';
  }

  static getMaxReconnectAttempts(): number {
    return parseInt(process.env.MCP_MAX_RECONNECT_ATTEMPTS || '5');
  }

  static getReconnectDelay(): number {
    return parseInt(process.env.MCP_RECONNECT_DELAY || '2000');
  }
}