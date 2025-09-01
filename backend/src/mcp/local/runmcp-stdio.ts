#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ApiService } from '../../services/api/ApiService.js';
import { ApiRegistry } from '../../services/api/apiRegistry.js';

// ---------------------
// Configuración y Constantes
// ---------------------
const SERVER_CONFIG = {
  name: 'bispace',
  version: '1.0.0',
  capabilities: {
    resources: {},
    tools: {},
  },
};

// ---------------------
// Logger mejorado con niveles y colores opcionales
// ---------------------
class Logger {
  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  private static shouldLog(level: string): boolean {
    const levels = {
      debug: parseInt(process.env.LOG_LEVEL_DEBUG || '0'),
      info: parseInt(process.env.LOG_LEVEL_INFO || '1'),
      warn: parseInt(process.env.LOG_LEVEL_WARN || '1'),
      error: parseInt(process.env.LOG_LEVEL_ERROR || '1')
    };
    
    return levels[level as keyof typeof levels] === 1;
  }

  static debug(message: string, metadata?: any): void {
    if (this.shouldLog('debug')) {
      const timestamp = this.getTimestamp();
      const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
      process.stderr.write(`[${timestamp}] [DEBUG] [bispace] ${message}${metaStr}\n`);
    }
  }

  static info(message: string): void {
    if (this.shouldLog('info')) {
      const timestamp = this.getTimestamp();
      process.stderr.write(`[${timestamp}] [INFO] [bispace] ${message}\n`);
    }
  }

  static warn(message: string, error?: any): void {
    if (this.shouldLog('warn')) {
      const timestamp = this.getTimestamp();
      const errorStr = error ? `: ${error}` : '';
      process.stderr.write(`[${timestamp}] [WARN] [bispace] ${message}${errorStr}\n`);
    }
  }

  static error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      const timestamp = this.getTimestamp();
      const errorStr = error ? `: ${error instanceof Error ? error.message : JSON.stringify(error)}` : '';
      process.stderr.write(`[${timestamp}] [ERROR] [bispace] ${message}${errorStr}\n`);
      
      if (error instanceof Error && process.env.DEBUG_STACK === '1') {
        process.stderr.write(`Stack: ${error.stack}\n`);
      }
    }
  }

  static success(message: string): void {
    this.info(`✅ ${message}`);
  }
}

// ---------------------
// Servicios con manejo de errores mejorado
// ---------------------
class ServiceManager {
  private static instance: ServiceManager;
  public apiRegistry: ApiRegistry;
  public apiService: ApiService;

  private constructor() {
    try {
      this.apiRegistry = new ApiRegistry();
      this.apiService = new ApiService(this.apiRegistry);
      Logger.debug('Services initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize services', error);
      throw error;
    }
  }

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      const apis = this.apiRegistry.getAllAPIs();
      Logger.info(`Registered APIs: ${apis.map(api => api.id).join(', ')}`);
      
      // Validar que las APIs necesarias estén disponibles
      const requiredApis = ['sabi'];
      const missingApis = requiredApis.filter(apiId => 
        !apis.some(api => api.id === apiId && api.active)
      );
      
      if (missingApis.length > 0) {
        Logger.warn(`Missing or inactive required APIs: ${missingApis.join(', ')}`);
      }
      
      return true;
    } catch (error) {
      Logger.error('Service initialization failed', error);
      return false;
    }
  }
}

// ---------------------
// Handlers de Recursos mejorados
// ---------------------
class ResourceHandlers {
  static async listResources(): Promise<any> {
    Logger.debug('Listing resources');
    
    try {
      const { apiRegistry } = ServiceManager.getInstance();
      const apis = apiRegistry.getAllAPIs();
      
      const resources = apis.flatMap(api => 
        api.endpoints.map(endpoint => ({
          uri: `api://${api.id}${endpoint.path}`,
          name: `${api.name} - ${endpoint.path}`,
          description: endpoint.description || `Endpoint ${endpoint.path} of ${api.name}`,
          mimeType: "application/json"
        }))
      );

      // Agregar recursos del sistema
      resources.push(
        {
          uri: "system://info",
          name: "System Information",
          description: "Información general del sistema",
          mimeType: "application/json"
        },
        {
          uri: "system://apis",
          name: "Available APIs",
          description: "Lista de APIs registradas en el sistema",
          mimeType: "application/json"
        },
        {
          uri: "system://health",
          name: "Health Status",
          description: "Estado de salud del servidor MCP",
          mimeType: "application/json"
        }
      );

      return { resources };
    } catch (error) {
      Logger.error('Error listing resources', error);
      throw new Error('Failed to list resources');
    }
  }

  static async readResource(uri: string): Promise<any> {
    Logger.debug(`Reading resource: ${uri}`);

    try {
      const { apiService, apiRegistry } = ServiceManager.getInstance();

      if (uri.startsWith('api://')) {
        const match = uri.match(/^api:\/\/([^\/]+)\/(.+)$/);
        if (!match) {
          throw new Error(`Invalid URI format: ${uri}`);
        }

        const apiId = match[1];
        const endpoint = `/${match[2]}`;

        // Verificar si la API existe y está activa
        const api = apiRegistry.getAPI(apiId);
        if (!api || !api.active) {
          throw new Error(`API ${apiId} no disponible`);
        }

        const data = await apiService.queryAPI(apiId, endpoint, {});
        
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2)
          }]
        };
      }
      else if (uri.startsWith('system://')) {
        const resource = uri.replace('system://', '');
        
        switch (resource) {
          case 'info':
            return {
              contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  app: 'bispace-mcp',
                  version: '1.0.0',
                  platform: process.platform,
                  arch: process.arch,
                  nodeVersion: process.version,
                  timestamp: new Date().toISOString(),
                  uptime: process.uptime()
                }, null, 2)
              }]
            };
          
          case 'apis':
            const apis = apiRegistry.getAllAPIs().map(api => ({
              id: api.id,
              name: api.name,
              description: api.description,
              baseUrl: api.baseUrl,
              active: api.active,
              endpoints: api.endpoints.map(e => ({
                path: e.path,
                method: e.method,
                description: e.description
              }))
            }));
            
            return {
              contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(apis, null, 2)
              }]
            };
          
          case 'health':
            return {
              contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  status: 'healthy',
                  timestamp: new Date().toISOString(),
                  memory: process.memoryUsage(),
                  uptime: process.uptime()
                }, null, 2)
              }]
            };
          
          default:
            throw new Error(`System resource not found: ${resource}`);
        }
      }
      else {
        throw new Error(`Unsupported resource type: ${uri}`);
      }
    } catch (error) {
      Logger.error(`Error reading resource ${uri}`, error);
      throw new Error(`Failed to read resource: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// ---------------------
// Handlers de Herramientas mejorados
// ---------------------
class ToolHandlers {
  static async listTools(): Promise<any> {
    Logger.debug('Listing tools');
    
    try {
      const { apiRegistry } = ServiceManager.getInstance();
      const apis = apiRegistry.getAllAPIs();
      
      // Crear herramientas dinámicas para cada API
      const apiTools = apis.filter(api => api.active).map(api => ({
        name: api.id,
        description: api.description || `Consultar la API ${api.name}`,
        inputSchema: {
          type: "object",
          properties: {
            endpoint: {
              type: "string",
              description: "Endpoint a consultar (ej: /usuarios)"
            },
            params: {
              type: "object",
              description: "Parámetros de consulta",
              additionalProperties: true
            }
          },
          required: ["endpoint"]
        }
      }));

      // Herramientas del sistema
      const systemTools = [
        {
          name: "api_discovery",
          description: "Descubrir APIs disponibles basado en consultas",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Consulta para buscar APIs (ej: 'usuarios', 'activos')"
              },
              type: {
                type: "string",
                description: "Filtrar por tipo de API"
              },
              limit: {
                type: "number",
                description: "Límite de resultados",
                default: 10,
                minimum: 1,
                maximum: 100
              }
            }
          }
        },
        {
          name: "system_info",
          description: "Obtener información del sistema",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ];

      return {
        tools: [...apiTools, ...systemTools]
      };
    } catch (error) {
      Logger.error('Error listing tools', error);
      throw new Error('Failed to list tools');
    }
  }

  static async callTool(name: string, args: Record<string, any>): Promise<any> {
    Logger.debug(`Calling tool: ${name}`, { args });

    try {
      const { apiRegistry, apiService } = ServiceManager.getInstance();

      // Verificar si es una herramienta de API específica
      const api = apiRegistry.getAPI(name);
      if (api && api.active) {
        return await this.handleApiTool(api, args);
      }

      // Manejar herramientas del sistema
      switch (name) {
        case "api_discovery":
          return await this.handleApiDiscovery(args);
        
        case "system_info":
          return await this.handleSystemInfo();
        
        default:
          throw new Error(`Herramienta desconocida: ${name}`);
      }
    } catch (error) {
      Logger.error(`Error calling tool ${name}`, error);
      
      // Proporcionar un mensaje de error más útil
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `❌ Error ejecutando herramienta "${name}": ${errorMessage}\n\nSugerencias:\n- Verifique que la API esté disponible\n- Confirme los parámetros requeridos\n- Revise los logs para más detalles`
        }]
      };
    }
  }

  private static async handleApiTool(api: any, args: Record<string, any>): Promise<any> {
    const { endpoint, params } = args;
    
    // Validaciones
    if (!endpoint) {
      throw new Error("El parámetro 'endpoint' es requerido");
    }
    
    if (typeof endpoint !== 'string') {
      throw new Error("El parámetro 'endpoint' debe ser una cadena de texto");
    }
    
    if (params && typeof params !== 'object') {
      throw new Error("El parámetro 'params' debe ser un objeto");
    }

    Logger.debug(`Calling API: ${api.id}${endpoint}`, { params });

    const { apiService } = ServiceManager.getInstance();
    const data = await apiService.queryAPI(api.id, endpoint, params || {}); 
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(data, null, 2)
      }]
    };
  }

  private static async handleApiDiscovery(args: Record<string, any>): Promise<any> {
    const { apiRegistry } = ServiceManager.getInstance();
    const allAPIs = apiRegistry.getAllAPIs();
    let filteredAPIs = allAPIs.filter(api => api.active);

    // Aplicar filtros
    if (args.type) {
      filteredAPIs = filteredAPIs.filter(api =>
        api.type.toLowerCase().includes(args.type.toLowerCase())
      );
    }

    if (args.query) {
      const lowerQuery = args.query.toLowerCase();
      filteredAPIs = filteredAPIs.filter(api =>
        api.name.toLowerCase().includes(lowerQuery) ||
        api.description.toLowerCase().includes(lowerQuery) ||
        (api.keywords && api.keywords.some(keyword => 
          keyword.toLowerCase().includes(lowerQuery)
        )) ||
        api.endpoints.some(endpoint =>
          endpoint.path.toLowerCase().includes(lowerQuery) ||
          (endpoint.description && endpoint.description.toLowerCase().includes(lowerQuery))
        )
      );
    }

    // Aplicar límite
    const limit = Math.min(Math.max(args.limit || 10, 1), 100);
    const results = filteredAPIs.slice(0, limit);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          count: results.length,
          total: allAPIs.length,
          apis: results.map(api => ({
            id: api.id,
            name: api.name,
            description: api.description,
            type: api.type,
            baseUrl: api.baseUrl,
            active: api.active,
            endpoints: api.endpoints.map(e => ({
              path: e.path,
              description: e.description,
              method: e.method
            }))
          })),
          metadata: {
            query: args.query,
            type: args.type,
            limit: limit,
            timestamp: new Date().toISOString()
          }
        }, null, 2)
      }]
    };
  }

  private static async handleSystemInfo(): Promise<any> {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
}

// ---------------------
// Servidor MCP Principal mejorado
// ---------------------
class McpServer {
  private server: Server;
  private transport: StdioServerTransport | null = null;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version,
      },
      {
        capabilities: SERVER_CONFIG.capabilities,
      }
    );
  }

  setupHandlers(): void {
    try {
      // Handlers de recursos
      this.server.setRequestHandler(ListResourcesRequestSchema, ResourceHandlers.listResources);
      this.server.setRequestHandler(ReadResourceRequestSchema, (request) => 
        ResourceHandlers.readResource(request.params.uri)
      );

      // Handlers de herramientas
      this.server.setRequestHandler(ListToolsRequestSchema, ToolHandlers.listTools);
      this.server.setRequestHandler(CallToolRequestSchema, (request) => 
        ToolHandlers.callTool(request.params.name, request.params.arguments as Record<string, any>)
      );

      Logger.debug('Handlers configured successfully');
    } catch (error) {
      Logger.error('Failed to setup handlers', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      // Inicializar servicios
      const serviceManager = ServiceManager.getInstance();
      const initialized = await serviceManager.initialize();
      
      if (!initialized) {
        throw new Error('Failed to initialize services');
      }

      // Configurar handlers
      this.setupHandlers();

      // Conectar transporte
      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);
      
      Logger.success('MCP Server connected and ready');
      
      // Configurar heartbeat para mantener la conexión activa
      this.setupHeartbeat();
      
    } catch (error) {
      Logger.error('Server startup failed', error);
      throw error;
    }
  }

  private setupHeartbeat(): void {
    // Enviar un heartbeat periódico para mantener la conexión activa
    const heartbeatInterval = setInterval(() => {
      Logger.debug('Heartbeat');
    }, 30000); // Cada 30 segundos

    // Limpiar intervalo al cerrar
    process.on('SIGINT', () => {
      clearInterval(heartbeatInterval);
    });
  }

  async stop(): Promise<void> {
    if (this.transport) {
      // Limpiar recursos
    }
    Logger.info('Server stopped');
  }
}

// ---------------------
// Manejo de Proceso mejorado
// ---------------------
process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') {
    Logger.info('Client disconnected');
    return;
  }
  
  Logger.error('Uncaught Exception', err);
  
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection', reason);
});

// Graceful shutdown
const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  
  isShuttingDown = true;
  Logger.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    // Aquí puedes agregar limpieza de recursos si es necesario
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pequeña espera
    process.exit(0);
  } catch (error) {
    Logger.error('Error during shutdown', error);
    process.exit(1);
  }
};

shutdownSignals.forEach(signal => {
  process.on(signal, () => gracefulShutdown(signal));
});

// ---------------------
// Punto de Entrada mejorado
// ---------------------
async function main() {
  try {
    Logger.info('Starting MCP Server...');
    
    const server = new McpServer();
    await server.start();
    
    // Mantener el proceso activo
    await new Promise(() => {});
    
  } catch (error) {
    Logger.error('Fatal error starting server', error);
    process.exit(1);
  }
}

// Manejar argumentos de línea de comandos
if (process.argv.includes('--debug')) {
  process.env.DEBUG = '1';
  process.env.DEBUG_STACK = '1';
}

// Ejecutar la aplicación
main().catch(error => {
  Logger.error('Unhandled error in main', error);
  process.exit(1);
});