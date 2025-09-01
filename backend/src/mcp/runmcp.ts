#!/usr/bin/env node
import { createServer, Server } from 'http';
import { McpServer } from './server/McpServer';
import { WsTransport } from './transport/WsTransport';
import { logger } from '../utils/logger';
import { ApiService } from '../services/api/ApiService';
import { ApiRegistry } from '../services/api/apiRegistry';
import { Config } from './config/config';
import { initializeDatabase, getDatabaseManager } from '../config/config/database.config';
import { DatabaseManager} from '../config/config/database.config';
import 'dotenv/config'; // O dotenv.config();


class McpApplication {
  private server: Server;
  private wsTransport: WsTransport;
  private apiRegistry: ApiRegistry;
  private apiService: ApiService;
  private mcpServer: McpServer;
  private port: number;
  private isDatabaseConnected: boolean = false;
   private dbManager?: DatabaseManager;
  

  constructor() {
    this.port = Config.getPort();
    this.server = createServer();
    this.setupHttpServer();
    
    this.apiRegistry = new ApiRegistry();
    this.apiService = new ApiService(this.apiRegistry);
    this.mcpServer = new McpServer(Config.getServerConfig(), this.apiService);
    this.wsTransport = new WsTransport(this.server, '/mcp');
    
    this.setupWebSocketHandlers();
    this.setupProcessHandlers();
  }

  private async initializeServices(): Promise<void> {
    try {
      logger.info('🔄 Inicializando servicios...');
      
      // 1. Inicializar base de datos
      await this.initializeDatabase();
      
      // 2. Inicializar registro de APIs
      await this.apiRegistry.initializeAPIs();
      
      logger.info('✅ Todos los servicios inicializados correctamente');
      
    } catch (error) {
      logger.error('❌ Error inicializando servicios:', error);
      throw error;
    }
  }


  
 private async initializeDatabase(): Promise<void> {
  try {
    // Guardar la instancia de DatabaseManager
    this.dbManager = await initializeDatabase();
    this.isDatabaseConnected = true;
    logger.info('✅ Conexión a PostgreSQL establecida');

    // Listar bases de datos disponibles
    const databases = await this.dbManager.listDatabases();
    logger.info(`📊 Bases de datos disponibles: ${databases.join(', ')}`);

  } catch (error) {
    this.isDatabaseConnected = false;
    logger.warn('⚠️  No se pudo conectar a PostgreSQL. Las funciones de base de datos estarán deshabilitadas.');
    logger.debug('Error de conexión a BD:', error);
  }
}


  private setupHttpServer(): void {
    this.server.on('request', (req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        this.handleHealthCheck(req, res);
        return;
      }

      if (req.url === '/databases' && req.method === 'GET') {
        this.handleDatabasesInfo(req, res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });
  }

  private handleHealthCheck(req: any, res: any): void {
    const healthStatus = {
      status: 'ok',
      service: 'mcp-server',
      timestamp: new Date().toISOString(),
      database: this.isDatabaseConnected ? 'connected' : 'disconnected',
      apis: this.apiRegistry.getAllAPIs().map(api => api.id),
      endpoints: [
        '/health',
        '/databases',
        '/mcp (WebSocket)'
      ]
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthStatus));
  }

  private async handleDatabasesInfo(req: any, res: any): Promise<void> {
    try {
      if (!this.isDatabaseConnected) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database not connected' }));
        return;
      }

      const dbManager = getDatabaseManager();
      const databases = await dbManager.listDatabases();
      
      const databasesInfo = {
        count: databases.length,
        databases: databases,
        connected: true,
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(databasesInfo));

    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error fetching database info' }));
    }
  }

  private setupWebSocketHandlers(): void {
    this.wsTransport.onMessage(async (message: any, ws: any) => {
      try {
        await this.mcpServer.handleMessage(message, ws);
      } catch (error) {
        logger.error('❌ Error manejando mensaje MCP:', error);
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: message.id || null,
          error: {
            code: -32000,
            message: 'Internal server error'
          }
        }));
      }
    });
  }

  private setupProcessHandlers(): void {
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('uncaughtException', (error) => this.handleUncaughtError('uncaughtException', error));
    process.on('unhandledRejection', (reason, promise) => this.handleUnhandledRejection(reason, promise));
  }

private async shutdown(signal: string): Promise<void> {
    logger.info(`🛑 Recibido ${signal}, apagando servidor MCP...`);
    
  // Cerrar todos los pools de BD
  if (this.dbManager) {
    await this.dbManager.closeAll();
  }

    this.server.close(() => {
      logger.info('✅ Servidor MCP apagado correctamente');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('❌ Apagado forzoso del servidor MCP');
      process.exit(1);
    }, 10000);
  }

  private handleUncaughtError(context: string, error: any): void {
    logger.error(`💥 ${context}:`, error);
    process.exit(1);
  }

  private handleUnhandledRejection(reason: any, promise: any): void {
    logger.error('💥 Promise rechazada no manejada:', reason);
    process.exit(1);
  }

  private logStartupInfo(): void {
    logger.info(`🚀 Servidor MCP WebSocket ejecutándose en puerto ${this.port}`);
    logger.info(`📡 Endpoint WebSocket: ws://localhost:${this.port}/mcp`);
    logger.info(`🏥 Health check: http://localhost:${this.port}/health`);
    logger.info(`📊 Info bases de datos: http://localhost:${this.port}/databases`);
    
    // Estado de la base de datos
    if (this.isDatabaseConnected) {
      logger.info('✅ PostgreSQL: Conectado');
    } else {
      logger.warn('⚠️  PostgreSQL: Desconectado (funciones de BD deshabilitadas)');
    }
    
    // APIs registradas
    const apis = this.apiRegistry.getAllAPIs();
    logger.info(`📊 APIs registradas: ${apis.length}`);
    apis.forEach(api => {
      logger.info(`   - ${api.id}: ${api.name} (${api.endpoints?.length || 0} endpoints)`);
    });
    
    logger.info('🛠️  Herramientas disponibles:');
    logger.info('   - api_query - Consultar endpoints de APIs');
    logger.info('   - api_discovery - Descubrir APIs disponibles');
    if (this.isDatabaseConnected) {
      logger.info('   - database_search - Buscar en bases de datos');
    }
  }

  public async start(): Promise<void> {
    try {
      // Inicializar servicios antes de empezar
      await this.initializeServices();
      
      this.server.listen(this.port, '0.0.0.0', () => {
        this.logStartupInfo();
      });
      
    } catch (error) {
      logger.error('❌ Error iniciando aplicación MCP:', error);
      process.exit(1);
    }
  }
}

// Inicializar y ejecutar la aplicación
const app = new McpApplication();
app.start().catch(error => {
  logger.error('💥 Error fatal iniciando aplicación:', error);
  process.exit(1);
});

// Exportar para posibles tests
export { McpApplication };