// src/controllers/api.controller.ts
import { Request, Response } from 'express';
import { APIManager } from '../services/api/apiManager';
import { APIResponse } from '../types/api.types';
import { handleError } from '../utils/errorHandler';
import { iaFactory } from '../services/ia/ia.factory';
import { logger } from '../utils/logger';
import { getAvailableAPIIds} from '../config/apis.config';
const apiManager = new APIManager();

export const apiController = {

    /**
   * Listar todos los apiIds disponibles
   */
async  listAPIIds(req: Request, res: Response){
    try {
      const apiIds = getAvailableAPIIds();
      
      const response: APIResponse<{apiIds: string[]}> = {
        success: true,
        data: { apiIds },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error listando API IDs:', error);
      const response: APIResponse = {
        success: false,
        error: 'Error obteniendo lista de APIs',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  },


  async queryEndpoint(req: Request, res: Response) {
    try {
      const { endpoint, apiId = 'sabi', ...params } = req.query;
      
      if (!endpoint) {
        return res.status(400).json({
          success: false,
          error: 'Parámetro "endpoint" es requerido'
        });
      }

      const response = await apiManager.queryAPI(
        apiId as string, 
        endpoint as string, 
        params
      );

      const apiResponse: APIResponse = {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      };

      res.json(apiResponse);
    } catch (error) {
      handleError(res, error, 'Error en queryEndpoint');
    }
  },

  async countEntities(req: Request, res: Response) {
    try {
      const { entity, apiId = 'sabi', ...filters } = req.query;
      
      if (!entity) {
        return res.status(400).json({
          success: false,
          error: 'Parámetro "entity" es requerido'
        });
      }

      // This would need to be implemented in APIManager
      const count = await apiManager.countEntities(
        apiId as string,
        entity as string,
        filters
      );

      const response: APIResponse = {
        success: true,
        data: { count, entity, filters },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'Error en countEntities');
    }
  },

  async getDocumentation(req: Request, res: Response) {
    try {
      const { format = 'openapi', apiId } = req.query;
      
      let documentation: any;
      
      if (apiId) {
        documentation = await apiManager.getAPIDocumentation(
          apiId as string, 
          format as 'openapi' | 'markdown'
        );
      } else {
        documentation = await apiManager.getConsolidatedDocumentation(
          format as 'openapi' | 'markdown'
        );
      }

      if (format === 'openapi') {
        res.setHeader('Content-Type', 'application/json');
      } else {
        res.setHeader('Content-Type', 'text/markdown');
      }

      res.send(documentation);
    } catch (error) {
      handleError(res, error, 'Error en getDocumentation');
    }
  },

  async listEndpoints(req: Request, res: Response) {
    try {
      const { apiId } = req.query;
      let endpoints: any[];
      
      if (apiId) {
        const api = await apiManager.getAPI(apiId as string);
        endpoints = api?.endpoints || [];
      } else {
        const apis = await apiManager.getAllAPIs();
        endpoints = apis.flatMap(api => api.endpoints || []);
      }

      const response: APIResponse = {
        success: true,
        data: {
          endpoints: endpoints.map(e => ({
            path: e.path,
            method: e.method,
            description: e.description
          })),
          count: endpoints.length
        },
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      handleError(res, error, 'Error en listEndpoints');
    }
    
  },
  // En src/controllers/api.controller.ts, agrega este método:
async listAPIs(req: Request, res: Response) {
  try {
    const apis = await apiManager.getAllAPIs();
    
    const response: APIResponse = {
      success: true,
      data: { apis },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    handleError(res, error, 'Error en listAPIs');
  }
}
  
};