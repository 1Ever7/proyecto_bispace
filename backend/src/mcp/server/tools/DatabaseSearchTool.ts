import { McpTool } from '../types/mcp.types';
import { getDatabaseManager } from '../../../config/config/database.config';
import { logger } from '../../../utils/logger';

export class DatabaseSearchTool {
  getToolInfo(): McpTool {
    return {
      name: 'database_search',
      description: 'Buscar información en todas las bases de datos de la empresa',
      inputSchema: {
        type: 'object',
        properties: {
          searchTerm: {
            type: 'string',
            description: 'Término a buscar (ej: "ever", "usuario", etc.)'
          },
          limit: {
            type: 'number',
            description: 'Límite de resultados por base de datos',
            default: 20
          },
          includeCount: {
            type: 'boolean',
            description: 'Incluir conteo total de ocurrencias',
            default: true
          }
        },
        required: ['searchTerm']
      }
    };
  }

  async execute(args: any): Promise<any> {
    try {
      const { searchTerm, limit = 20, includeCount = true } = args;

      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new Error('El término de búsqueda debe tener al menos 2 caracteres');
      }

      logger.info(`Buscando término "${searchTerm}" en todas las bases de datos`);

      const dbManager = getDatabaseManager();

      // Buscar en todas las bases de datos
      const searchResults = await dbManager.searchAcrossDatabases(searchTerm, limit);

      // Obtener conteo si se solicita
      let countResult = null;
      if (includeCount) {
        countResult = await dbManager.countOccurrences(searchTerm);
      }

      // Formatear resultados
      const formattedResults = this.formatResults(searchResults, searchTerm);

      return {
        success: true,
        searchTerm,
        results: formattedResults,
        statistics: countResult ? {
          totalOccurrences: countResult.total,
          byDatabase: countResult.byDatabase
        } : null,
        metadata: {
          timestamp: new Date().toISOString(),
          searchLimit: limit
        }
      };

    } catch (error) {
      logger.error('Error en herramienta database_search:', error);
      return {
        success: false,
        error: error,
        suggestion: 'Verifique la conexión a la base de datos y los parámetros de búsqueda'
      };
    }
  }

  private formatResults(results: any[], searchTerm: string): any {
    if (results.length === 0) {
      return {
        message: `No se encontraron resultados para "${searchTerm}"`,
        databasesSearched: 0,
        totalRecords: 0
      };
    }

    const databaseSummary: { [db: string]: { tables: number; records: number } } = {};
    let totalRecords = 0;

    // Procesar resultados
    const formatted = results.map(result => {
      const dbName = result.database;
      
      if (!databaseSummary[dbName]) {
        databaseSummary[dbName] = { tables: 0, records: 0 };
      }

      databaseSummary[dbName].tables += 1;
      databaseSummary[dbName].records += result.matchCount;
      totalRecords += result.matchCount;

      return {
        database: dbName,
        table: result.table,
        recordCount: result.matchCount,
        sampleRecords: result.records.slice(0, 3) // Mostrar solo 3 registros de muestra
      };
    });

    return {
      summary: {
        totalDatabases: Object.keys(databaseSummary).length,
        totalTables: results.length,
        totalRecords,
        byDatabase: databaseSummary
      },
      detailedResults: formatted,
      searchTerm
    };
  }
}