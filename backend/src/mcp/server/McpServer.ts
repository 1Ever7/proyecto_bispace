// src/server/McpServer.ts
import { McpMessage, McpServerConfig, McpRequest, McpResponse } from '../server/types/mcp.types';
import { ApiResource } from './resources/ApiResource';
import { SystemResource } from './resources/SystemResource';
import { ApiQueryTool } from './tools/ApiQueryTool';
import { ApiDiscoveryTool } from './tools/ApiDiscoveryTool';
import { logger } from '../../utils/logger';
import { ApiService } from '../../services/api/ApiService';
import { DatabaseSearchTool } from './tools/DatabaseSearchTool';
import { DatabaseResource } from './resources/DatabaseResource';


export class McpServer {
  private config: McpServerConfig;
  private apiService: ApiService;
  private apiResource: ApiResource;
  private systemResource: SystemResource;
  private apiQueryTool: ApiQueryTool;
  private apiDiscoveryTool: ApiDiscoveryTool;
  private connectedClients: Set<WebSocket> = new Set();
  private initialized: boolean = false;
  private databaseResource: DatabaseResource;
  private databaseSearchTool: DatabaseSearchTool;

  constructor(config: McpServerConfig, apiService: ApiService) {
    this.config = config;
    this.apiService = apiService;
    this.apiResource = new ApiResource(this.apiService);
    this.systemResource = new SystemResource();
    this.databaseResource = new DatabaseResource(); // ← Nuevo recurso
    this.apiQueryTool = new ApiQueryTool(this.apiService);
    this.apiDiscoveryTool = new ApiDiscoveryTool(this.apiService);
    this.databaseSearchTool = new DatabaseSearchTool(); // ← Nueva herramienta
    

  }

  // MÉTODO PÚBLICO para Stdio transport
// En tu McpServer.ts - Añadir este método
async handleRequestForStdio(message: any): Promise<any> {
  try {
    // Validar mensaje JSON-RPC básico
    if (!message || message.jsonrpc !== '2.0') {
      return {
        error: {
          code: -32600,
          message: 'Invalid Request'
        }
      };
    }

    if (message.id === undefined || message.id === null) {
      return {
        error: {
          code: -32600,
          message: 'Missing id field'
        }
      };
    }

    // Manejar la solicitud
    const response = await this.handleRequest(message);
    
    return response;
  } catch (error) {
    return {
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

  async handleMessage(message: any, ws: WebSocket): Promise<void> {
    try {
      // Validar estructura básica del mensaje MCP
      if (!this.isValidMcpMessage(message)) {
        this.sendError(ws, null, -32600, 'Invalid Request');
        return;
      }

      // Registrar el cliente si no está registrado
      if (!this.connectedClients.has(ws)) {
        this.connectedClients.add(ws);
      }

      const response = await this.handleRequest(message);
      
      // Solo enviar respuesta si el mensaje tenía un ID (no es una notificación)
      if (message.id !== undefined) {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          ...response
        }));
      }
    } catch (error) {
      logger.error('Error procesando mensaje MCP:', error, message);
      this.sendError(ws, message.id, -32603, 'Internal error');
    }
  }

  private isValidMcpMessage(message: any): boolean {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.method === 'string' &&
      message.jsonrpc === '2.0'
      // No requieras id para notificaciones
    );
  }

  private sendError(ws: WebSocket, id: any, code: number, message: string): void {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    }));
  }

  public async handleRequest(message: McpMessage): Promise<McpResponse> {
    try {
      console.error(`🔄 [DEBUG] handleRequest called: ${message.method}`);
      
      if (!this.isValidMcpMessage(message)) {
        console.error('❌ [DEBUG] Invalid message format');
        return { error: { code: -32600, message: 'Invalid Request' } };
      }

      const { method, params } = message;
      
      switch (method) {
        case 'initialize':
          console.error('🔧 [DEBUG] Calling handleInitialize...');
          const initResult = await this.handleInitialize(params);
          console.error('✅ [DEBUG] handleInitialize completed');
          return initResult;
        
        case 'resources/list':
          console.error('📋 [DEBUG] Calling handleListResources...');
          return this.handleListResources();
        
        case 'resources/read':
          console.error('📖 [DEBUG] Calling handleReadResource...');
          return this.handleReadResource(params);
        
        case 'tools/list':
          console.error('🔧 [DEBUG] Calling handleListTools...');
          return this.handleListTools();
        
        case 'tools/call':
          console.error('⚡ [DEBUG] Calling handleCallTool...');
          return this.handleCallTool(params);
        
        case 'ping':
          console.error('🏓 [DEBUG] Ping received');
          return { result: 'pong' };
        
        case 'notifications/cancelled':
          console.error('🔔 [DEBUG] Cancellation notification');
          return { result: { cancelled: true } };
        
        default:
          console.error(`❌ [DEBUG] Unsupported method: ${method}`);
          return { error: { code: -32601, message: `Method not supported: ${method}` } };
      }
    } catch (error) {
      console.error('❌ [DEBUG] handleRequest exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: { code: -32603, message: errorMessage } };
    }
  }

  // Método handleInitialize corregido - ASYNC y con mejor logging
  private async handleInitialize(params: any): Promise<McpResponse> {
    try {
      console.error('🔧 [DEBUG] handleInitialize started with params:', JSON.stringify(params, null, 2));
      
      const { protocolVersion, capabilities, clientInfo } = params || {};
      
      console.error('📋 [DEBUG] Client info:', JSON.stringify(clientInfo));
      console.error('🔌 [DEBUG] Protocol version requested:', protocolVersion);
      
      // Marcar como inicializado
      this.initialized = true;
      
      // Verificar compatibilidad de versión del protocolo
      const supportedVersions = ['2024-11-05', '2025-06-18'];
      const versionToUse = supportedVersions.includes(protocolVersion) ? protocolVersion : '2025-06-18';
      
      if (protocolVersion && !supportedVersions.includes(protocolVersion)) {
        console.error(`⚠️ [DEBUG] Unsupported protocol version: ${protocolVersion}, using: ${versionToUse}`);
      }

      const result = {
        result: {
          protocolVersion: versionToUse,
          capabilities: {
            resources: {}, // Formato MCP 2025
            tools: {},     // Formato MCP 2025
            logging: {}    // Formato MCP 2025
          },
          serverInfo: {
            name: this.config.name,
            version: this.config.version
          }
        }
      };
      
      console.error('✅ [DEBUG] handleInitialize returning:', JSON.stringify(result, null, 2));
      return result;
      
    } catch (error) {
      console.error('❌ [DEBUG] handleInitialize error:', error);
      return {
        error: {
          code: -32603,
          message: 'Initialize failed',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  private handleListResources(): McpResponse {
    try {
      console.error('📋 [DEBUG] handleListResources called');
      const result = {
        result: {
          resources: [
            this.apiResource.getResourceInfo(),
            this.systemResource.getResourceInfo(),
          this.databaseResource.getResourceInfo()
          ]
        }
      };
      console.error('✅ [DEBUG] handleListResources returning:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('❌ [DEBUG] handleListResources error:', error);
      return {
        error: {
          code: -32603,
          message: 'Failed to list resources',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  private async handleReadResource(params: any): Promise<McpResponse> {
    try {
      console.error('📖 [DEBUG] handleReadResource called with:', JSON.stringify(params, null, 2));
      
      const { uri } = params;
      
      if (!uri) {
        return { error: { code: -32602, message: 'Missing uri parameter' } };
      }
      
      let result;
      if (uri.startsWith('api://')) {
        result = await this.apiResource.read(uri);
      } else if (uri.startsWith('system://')) {
        result = await this.systemResource.read(uri);
      } else {
        return { error: { code: -32602, message: `Unsupported URI scheme: ${uri}` } };
      }

      if (uri.startsWith('database://')) {
        return { result: await this.databaseResource.read(uri) }; // ← Nuevo recurso
       }

      console.error('✅ [DEBUG] handleReadResource success');
      return { result };
      
    } catch (error) {
      console.error('❌ [DEBUG] handleReadResource error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: { code: -32603, message: errorMessage } };
    }
  }

  private handleListTools(): McpResponse {
    try {
      console.error('🔧 [DEBUG] handleListTools called');
      const result = {
        result: {
          tools: [
            this.apiQueryTool.getToolInfo(),
            this.apiDiscoveryTool.getToolInfo(),
            this.databaseSearchTool.getToolInfo() 
          ]
        }
      };
      console.error('✅ [DEBUG] handleListTools returning:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('❌ [DEBUG] handleListTools error:', error);
      return {
        error: {
          code: -32603,
          message: 'Failed to list tools',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  private async handleCallTool(params: any): Promise<McpResponse> {
    try {
      console.error('⚡ [DEBUG] handleCallTool called with:', JSON.stringify(params, null, 2));
      
      const { name, arguments: args } = params;

      if (!name) {
        return { error: { code: -32602, message: 'Missing tool name' } };
      }

      let result;
      switch (name) {
        case 'api_query':
          result = await this.apiQueryTool.execute(args);
          break;
        
        case 'api_discovery':
          result = await this.apiDiscoveryTool.execute(args);
          break;
        case 'database_search': // ← Nueva herramienta
          return { result: await this.databaseSearchTool.execute(args) };
        default:
          return { error: { code: -32601, message: `Tool not supported: ${name}` } };
      }

      console.error('✅ [DEBUG] handleCallTool success');
      return { result };
      
    } catch (error) {
      console.error('❌ [DEBUG] handleCallTool error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        error: {
          code: -32601,
          message: `Tool execution failed: ${errorMessage}`
        }
      };
    }
  }

  // Método para limpiar clientes desconectados
  removeClient(ws: WebSocket): void {
    this.connectedClients.delete(ws);
  }

  // Getter para estado
  public get isInitialized(): boolean {
    return this.initialized;
  }
}