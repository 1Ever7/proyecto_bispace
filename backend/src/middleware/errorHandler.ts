import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { formatErrorResponse } from '../utils/formatters/apiResponseFormatter';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error no manejado:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  res.status(500).json(formatErrorResponse('Error interno del servidor'));
};