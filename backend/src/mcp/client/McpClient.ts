//client/McpClient
import WebSocket from 'ws';
import { McpMessage, McpRequest, McpResponse, ApiQueryParams, ApiDiscoveryParams } from '../server/types/mcp.types';
import { logger } from '../../utils/logger';

export class McpClient {
  private ws: WebSocket | null = null;
  private messageId: number = 0;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;

  constructor(
    private url: string = 'ws://localhost:3003/mcp',
    private options: WebSocket.ClientOptions = {}
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.options);

        this.ws.on('open', () => {
          logger.info('✅ Conectado al servidor MCP WebSocket');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', (code: number, reason: string) => {
          logger.warn(`❌ Conexión MCP cerrada: ${code} - ${reason}`);
          this.attemptReconnect();
        });

        this.ws.on('error', (error: Error) => {
          logger.error('❌ Error en conexión MCP:', error);
          reject(error);
        });

        // Timeout de conexión
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('Timeout de conexión MCP'));
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`🔄 Intentando reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

      setTimeout(async () => {
        try {
          await this.connect();
        } catch (error) {
          logger.error('Error en reconexión:', error);
        }
      }, this.reconnectDelay);
    } else {
      logger.error('❌ Máximo de intentos de reconexión alcanzado');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    logger.info('🔌 Cliente MCP desconectado');
  }

  private handleMessage(rawMessage: string): void {
    try {
      const message: McpMessage = JSON.parse(rawMessage);
      
      if (typeof message.id === 'number' && this.pendingRequests.has(message.id)) {
  const { resolve, reject } = this.pendingRequests.get(message.id)!;
  
        if (message.error) {
          reject(new Error(message.error.message));
        } else {
          resolve(message.result);
        }

        this.pendingRequests.delete(message.id);
      }
    } catch (error) {
      logger.error('❌ Error procesando mensaje MCP:', error);
    }
  }

  private async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Cliente MCP no conectado');
    }

    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      
      const message: McpMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });

      this.ws!.send(JSON.stringify(message), (error) => {
        if (error) {
          this.pendingRequests.delete(id);
          reject(error);
        }
      });

      // Timeout después de 30 segundos
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Timeout esperando respuesta MCP'));
        }
      }, 30000);
    });
  }

  // 🔧 MÉTODOS DE HERRAMIENTAS

  // 🔧 MÉTODOS DE HERRAMIENTAS

async queryApi(apiId: string, endpoint: string, params?: any, method?: string): Promise<any> {
  return this.sendRequest('tools/call', {
    name: 'api_query',
    arguments: { apiId, endpoint, params, method }
  });
}

async discoverApis(query?: string, type?: string, limit?: number): Promise<any> {
  return this.sendRequest('tools/call', {
    name: 'api_discovery',
    arguments: { query, type, limit }
  });
}

// 🔑 NUEVO MÉTODO
async callTool(name: string, args: Record<string, any>): Promise<any> {
  return this.sendRequest('tools/call', { name, arguments: args });
}


  // 📚 MÉTODOS DE RECURSOS

  async listResources(): Promise<any> {
    return this.sendRequest('resources/list');
  }

  async readResource(uri: string): Promise<any> {
    return this.sendRequest('resources/read', { uri });
  }

  async readApiResource(apiId: string, endpoint: string): Promise<any> {
    return this.readResource(`api://${apiId}${endpoint}`);
  }

  async readSystemResource(resource: string): Promise<any> {
    return this.readResource(`system://${resource}`);
  }

  // 🛠️ MÉTODOS DEL SISTEMA

  async listTools(): Promise<any> {
    return this.sendRequest('tools/list');
  }

  async ping(): Promise<string> {
    return this.sendRequest('ping');
  }

  async initialize(): Promise<any> {
    return this.sendRequest('initialize', {
      clientInfo: {
        name: 'mcp-client',
        version: '1.0.0'
      }
    });
  }

  // 📊 MÉTODOS DE MONITOREO

  getConnectionStatus(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }

  getReconnectInfo(): { attempts: number; maxAttempts: number } {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    };
  }
}

// 📦 Función de fábrica para crear cliente MCP
export const createMcpClient = (url?: string, options?: WebSocket.ClientOptions): McpClient => {
  return new McpClient(url, options);
};