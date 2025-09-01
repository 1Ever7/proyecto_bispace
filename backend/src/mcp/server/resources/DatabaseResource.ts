import { McpResource } from '../types/mcp.types';
import { getDatabaseManager } from '../../../config/config/database.config';
import { logger } from '../../../utils/logger';

export class DatabaseResource {
  getResourceInfo(): McpResource {
    return {
      uri: 'database://{databaseName}/{resourceType}',
      name: 'Database Resource',
      description: 'Información y búsqueda en bases de datos de la empresa',
      mimeType: 'application/json'
    };
  }

  async read(uri: string): Promise<any> {
    try {
      // Parsear URI: database://sistema_rh/info o database://all/search?term=ever
      const match = uri.match(/^database:\/\/([^\/]+)\/([^?]+)(\?.*)?$/);
      if (!match) {
        throw new Error(`URI inválida: ${uri}`);
      }

      const databaseName = match[1];
      const resourceType = match[2];
      const queryParams = new URLSearchParams(match[3] || '');

      const dbManager = getDatabaseManager();

      switch (resourceType) {
        case 'info':
          if (databaseName === 'all') {
            const databases = await dbManager.listDatabases();
            const databasesInfo = await Promise.all(
              databases.map(db => dbManager.getDatabaseInfo(db))
            );
            return this.formatResponse(databasesInfo);
          } else {
            const info = await dbManager.getDatabaseInfo(databaseName);
            return this.formatResponse(info);
          }

        case 'search':
          const searchTerm = queryParams.get('term');
          if (!searchTerm) {
            throw new Error('Parámetro "term" requerido para búsqueda');
          }

          let results;
          if (databaseName === 'all') {
            results = await dbManager.searchAcrossDatabases(searchTerm, 50);
          } else {
            results = await dbManager.searchInDatabase(databaseName, searchTerm, 50);
          }

          return this.formatResponse({
            searchTerm,
            results,
            database: databaseName
          });

        case 'count':
          const countTerm = queryParams.get('term');
          if (!countTerm) {
            throw new Error('Parámetro "term" requerido para conteo');
          }

          let countResult;
          if (databaseName === 'all') {
            countResult = await dbManager.countOccurrences(countTerm);
          } else {
            countResult = await dbManager.countInDatabase(databaseName, countTerm);
          }

          return this.formatResponse({
            term: countTerm,
            count: countResult
          });

        default:
          throw new Error(`Tipo de recurso no soportado: ${resourceType}`);
      }

    } catch (error) {
      logger.error(`Error leyendo recurso de base de datos ${uri}:`, error);
      throw new Error(`No se pudo leer el recurso: ${error}`);
    }
  }

  private formatResponse(data: any): { content: string; mimeType: string } {
    return {
      content: JSON.stringify(data, null, 2),
      mimeType: 'application/json'
    };
  }
}