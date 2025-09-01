// index.ts - VERSIÓN CORREGIDA
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import './config/env-setup'; 
// 🚨 CRÍTICO: CARGAR DOTENV ANTES QUE CUALQUIER OTRO IMPORT DE LA APLICACIÓN
const envPath = path.resolve(__dirname, '../.env');
console.log('📁 Loading .env from:', envPath);

dotenv.config({ path: envPath });

// Verificación inmediata
console.log('🔍 Variables de entorno cargadas:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `✅ (${process.env.GEMINI_API_KEY.length} caracteres)` : '❌ NO ENCONTRADA');
console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '✅ PRESENTE' : '❌ NO ENCONTRADA');

// AHORA SÍ IMPORTAR LOS MÓDULOS DE LA APLICACIÓN (después de cargar dotenv)
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { Constants } from './config/constants';
import { setupSwagger } from './utils/swagger/swaggerSetup';

// IMPORTAR RUTAS AL FINAL (después de que dotenv esté cargado)
import apiRoutes from './routes/api.route';
import chatRoutes from './routes/chat.route';

const app = express();
const port = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

app.use(compression());

// Middleware de logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));

// Middleware para parsing de JSON
app.use(express.json({ limit: Constants.MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: Constants.MAX_REQUEST_SIZE }));

// 📚 Configuración de Swagger (debe ir antes de las rutas)
setupSwagger(app);

// Rutas de la API
app.use('/api', apiRoutes);
app.use('/api/chat', chatRoutes);

// Debug de rutas registradas
console.log('🛣️  Rutas registradas:');
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    console.log(`   ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    console.log(`   Router montado en: ${middleware.regexp}`);
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        console.log(`     ${Object.keys(handler.route.methods)} ${handler.route.path}`);
      }
    });
  }
});

// Ruta de health check básica
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    config: {
      hasClaudeKey: !!process.env.CLAUDE_API_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    }
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido al API Assistant',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
    endpoints: {
      api: '/api',
      chat: '/chat'
    }
  });
});

// Manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`,
    availableEndpoints: {
      documentation: '/api-docs',
      health: '/health',
      api: '/api',
      chat: '/chat'
    }
  });
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

// Iniciar servidor
const server = app.listen(port, () => {
  logger.info(`🚀 Servidor ejecutándose en el puerto ${port}`);
  logger.info(`📚 Documentación disponible en: http://localhost:${port}/api-docs`);
  logger.info(`🏥 Health check disponible en: http://localhost:${port}/health`);
  
  // Verificación final al iniciar
  logger.info('🔧 Estado de configuración:', {
    claudeConfigured: !!process.env.CLAUDE_API_KEY,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV
  });
});

// Manejo graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;