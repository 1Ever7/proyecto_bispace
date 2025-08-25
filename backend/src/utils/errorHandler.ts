import { Response } from 'express';
import { logger, safeLog } from './logger';

export interface SafeError {
  message: string;
  name?: string;
  stack?: string;
  code?: string;
  statusCode?: number;
}

export function sanitizeError(error: any): SafeError {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: (error as any).code,
      statusCode: (error as any).statusCode || (error as any).status
    };
  }
  
  // Para objetos que no son Error, convertirlos a string de forma segura
  try {
    return {
      message: typeof error === 'object' ? JSON.stringify(error) : String(error)
    };
  } catch {
    return {
      message: 'Unserializable error object'
    };
  }
}

export function handleError(res: Response, error: any, context: string = 'Error') {
  const safeError = sanitizeError(error);
  
  safeLog.error(`${context}:`, error);
  
  const statusCode = safeError.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: safeError.message,
    ...(process.env.NODE_ENV === 'development' && { details: safeError })
  });
}

export class APIError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }
}