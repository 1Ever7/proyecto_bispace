import { createLogger, format, transports } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Función segura para serializar objetos con referencias circulares
const safeStringify = (obj: any, indent = 2): string => {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        // Referencia circular encontrada
        return '[Circular]';
      }
      cache.add(value);
    }
    return value;
  }, indent);
};

// Asegurar que el directorio de logs existe
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Formatos personalizados
const customFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message} `;
  
  if (Object.keys(metadata).length > 0) {
    // Usar serialización segura para evitar estructuras circulares
    try {
      msg += safeStringify(metadata);
    } catch (error) {
      msg += '[Object contains circular references]';
    }
  }
  
  return msg;
});

// Crear el logger
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    // Transporte para consola
    new transports.Console({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      )
    }),
    
    // Transporte para archivo de errores
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json() // JSON maneja automáticamente las referencias circulares
      ),
      maxsize: 10485760,
      maxFiles: 5
    }),
    
    // Transporte para archivo de todos los logs
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json()
      ),
      maxsize: 10485760,
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json()
      )
    })
  ]
});

// Función segura para loggear objetos
export const safeLog = {
  info: (message: string, data?: any) => {
    if (data) {
      try {
        logger.info(message, { data: safeStringify(data) });
      } catch (error) {
        logger.info(message, { data: '[Unserializable object]' });
      }
    } else {
      logger.info(message);
    }
  },
  
  error: (message: string, error?: any) => {
    if (error) {
      if (error instanceof Error) {
        logger.error(message, { 
          error: error.message,
          stack: error.stack 
        });
      } else {
        try {
          logger.error(message, { error: safeStringify(error) });
        } catch (e) {
          logger.error(message, { error: '[Unserializable error object]' });
        }
      }
    } else {
      logger.error(message);
    }
  }
};

// Stream para morgan (logging de HTTP)
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export default logger;