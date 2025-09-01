import rateLimit from 'express-rate-limit';
import { Constants } from '../config/constants';
import { formatErrorResponse } from '../utils/formatters/apiResponseFormatter';

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: Constants.MAX_REQUESTS_PER_MINUTE,
  message: formatErrorResponse('Límite de tasa excedido'),
  standardHeaders: true,
  legacyHeaders: false,
});

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // Límite más bajo para endpoints de chat
  message: formatErrorResponse('Límite de tasa excedido para chat'),
  standardHeaders: true,
  legacyHeaders: false,
});