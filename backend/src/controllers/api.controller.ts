import { Request, Response } from 'express';
import { ApiService } from '../services/api/ApiService';
import { formatSuccessResponse, formatErrorResponse } from '../utils/formatters/apiResponseFormatter';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/global.types';
import { ApiRegistry } from '../services/api/apiRegistry';

export class ApiController {
  private apiService: ApiService;
  private apiRegistry: ApiRegistry;
  
  constructor() {
    this.apiRegistry = new ApiRegistry();
    this.apiService = new ApiService();
  }

  registerAPI = async (req: Request, res: Response): Promise<void> => {
    try {
      const apiConfig = req.body;
      
      if (!this.validateAPIConfig(apiConfig)) {
        res.status(400).json(formatErrorResponse('Configuración de API inválida'));
        return;
      }

      const success = await this.apiService.registerAPI(apiConfig);
      
      if (success) {
        const response: APIResponse = formatSuccessResponse({
          message: 'API registrada exitosamente',
          apiId: apiConfig.id
        });
        res.status(201).json(response);
      } else {
        res.status(400).json(formatErrorResponse('Error al registrar API'));
      }
    } catch (error) {
      logger.error('Error en registerAPI:', error);
      res.status(500).json(formatErrorResponse('Error interno del servidor'));
    }
  };

  getAPIs = async (req: Request, res: Response): Promise<void> => {
    try {
      const apis = await this.apiService.getAllAPIs();
      res.json(formatSuccessResponse(apis));
    } catch (error) {
      logger.error('Error en getAPIs:', error);
      res.status(500).json(formatErrorResponse('Error interno del servidor'));
    }
  };

  getAPIHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const { apiId } = req.params;
      const healthStatus = await this.apiService.checkAPIHealth(apiId);
      res.json(formatSuccessResponse(healthStatus));
    } catch (error) {
      logger.error('Error en getAPIHealth:', error);
      res.status(500).json(formatErrorResponse('Error interno del servidor'));
    }
  };

  getAllAPIHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const healthStatuses = await this.apiService.checkAllAPIsHealth();
      res.json(formatSuccessResponse(healthStatuses));
    } catch (error) {
      logger.error('Error en getAllAPIHealth:', error);
      res.status(500).json(formatErrorResponse('Error interno del servidor'));
    }
  };

  private validateAPIConfig(config: any): boolean {
    const requiredFields = ['id', 'name', 'baseUrl', 'description'];
    return requiredFields.every(field => config[field]);
  }
}

export const apiController = new ApiController();