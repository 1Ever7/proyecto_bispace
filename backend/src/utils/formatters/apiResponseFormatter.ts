import { APIResponse } from '../../types/global.types';

export const formatSuccessResponse = (data: any, message?: string): APIResponse => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

export const formatErrorResponse = (error: string, message?: string): APIResponse => ({
  success: false,
  error,
  message,
  timestamp: new Date().toISOString()
});

export const formatValidationError = (details: any[]): APIResponse => ({
  success: false,
  error: 'Error de validación',
  message: 'Datos de entrada inválidos',
  details,
  timestamp: new Date().toISOString()
});