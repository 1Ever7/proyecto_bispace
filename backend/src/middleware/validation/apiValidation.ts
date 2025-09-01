import { Request, Response, NextFunction } from 'express';
import { formatErrorResponse } from '../../utils/formatters/apiResponseFormatter';

export const validateAPIRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { id, name, baseUrl, description } = req.body;

  if (!id || !name || !baseUrl || !description) {
    res.status(400).json(formatErrorResponse('Campos requeridos: id, name, baseUrl, description'));
    return;
  }

  // Validar formato de URL
  try {
    new URL(baseUrl);
  } catch (error) {
    res.status(400).json(formatErrorResponse('URL base inválida'));
    return;
  }

  // Validar que el ID sea alfanumérico
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    res.status(400).json(formatErrorResponse('ID de API debe ser alfanumérico'));
    return;
  }

  next();
};

export const validateChatRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { message, model, apiId } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json(formatErrorResponse('Campo message requerido y debe ser texto'));
    return;
  }

  if (message.length > 500) {
    res.status(400).json(formatErrorResponse('El mensaje no puede exceder 500 caracteres'));
    return;
  }

  if (model && typeof model !== 'string') {
    res.status(400).json(formatErrorResponse('Model debe ser texto'));
    return;
  }

  if (apiId && typeof apiId !== 'string') {
    res.status(400).json(formatErrorResponse('apiId debe ser texto'));
    return;
  }

  next();
};