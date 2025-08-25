import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { setupSwagger } from './utils/swaggerSetup';
import chatRoutes from './routes/chat.route';
import apiRoutes from './routes/api.route';
import { handleError } from './utils/errorHandler';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares básicos PRIMERO
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Configurar rutas de API (ESTAS DEBEN ESTAR DESPUÉS DE LOS MIDDLEWARES)
app.use('/api/chat', chatRoutes);
app.use('/api', apiRoutes);

// Función async para inicialización
async function initializeServer() {
  try {
    // Configurar Swagger UI
    await setupSwagger(app);
    
    logger.info('✅ Swagger configurado exitosamente');

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          http: 'running',
          swagger: 'enabled',
          mcp: process.env.RUN_MCP === 'true' ? 'enabled' : 'disabled'
        }
      });
    });

    // Info endpoint
    app.get('/info', (req, res) => {
      res.json({
        name: 'API Assistant Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          chat: '/api/chat',
          api: '/api/query, /api/count, /api/docs, /api/endpoints',
          documentation: '/api-docs',
          health: '/health',
          info: '/info'
        },
        documentation: {
          swagger_ui: '/api-docs',
          swagger_json: '/api-docs/json'
        }
      });
    });

    // Ruta de bienvenida
    app.get('/', (req, res) => {
      res.json({
        message: 'Bienvenido al API Assistant',
        status: 'running',
        documentation: 'Visita /api-docs para la documentación Swagger',
        health_check: '/health',
        info: '/info'
      });
    });

    // Ruta no encontrada (DEBE SER EL ÚLTIMO MIDDLEWARE)
    app.use('*', (req, res) => {
      res.status(404).json({ 
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        available_endpoints: [
          'GET /',
          'GET /health',
          'GET /info',
          'GET /api-docs',
          'GET /api-docs/json',
          'POST /api/chat',
          'GET /api/query',
          'GET /api/count',
          'GET /api/docs',
          'GET /api/endpoints'
        ]
      });
    });

    // Manejo de errores
    app.use((err: any, req: any, res: any, next: any) => {
      logger.error('Error no manejado:', err);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador',
        timestamp: new Date().toISOString()
      });
    });

    // Iniciar servidor
    const server = app.listen(port, () => {
      logger.info(`🚀 Servidor ejecutándose en http://localhost:${port}`);
      logger.info(`📚 Swagger UI: http://localhost:${port}/api-docs`);
      logger.info(`📊 Health Check: http://localhost:${port}/health`);
      logger.info(`ℹ️ Info: http://localhost:${port}/info`);
      logger.info(`💬 Chat API: http://localhost:${port}/api/chat`);
    });

    // Manejo de cierre graceful
    process.on('SIGINT', () => {
      logger.info('Recibido SIGINT. Cerrando servidor...');
      server.close(() => {
        logger.info('Servidor HTTP cerrado.');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      logger.info('Recibido SIGTERM. Cerrando servidor...');
      server.close(() => {
        logger.info('Servidor HTTP cerrado.');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('❌ Error crítico inicializando el servidor:', error);
    
    // Configuración de emergencia
    app.use('*', (req, res) => {
      res.status(500).json({
        success: false,
        error: 'Error inicializando el servidor',
        timestamp: new Date().toISOString()
      });
    });

    const server = app.listen(port, () => {
      logger.error(`⚠️ Servidor iniciado en modo de emergencia en puerto ${port}`);
    });
  }
}

// Inicializar el servidor
initializeServer().catch(error => {
  logger.error('❌ Error fatal inicializando la aplicación:', error);
  process.exit(1);
});

export default app;