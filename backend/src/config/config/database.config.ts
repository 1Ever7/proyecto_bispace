import { Pool, PoolConfig } from 'pg';
import { logger } from '../../utils/logger';
import 'dotenv/config'; // O dotenv.config();


export interface DatabaseConfig extends PoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  // No especificamos database aquí, usaremos una conexión general
}

export interface DatabaseInfo {
  name: string;
  description: string;
  tables: string[];
}


export class DatabaseManager {
   private pools: Record<string, Pool> = {};
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig, databases: string[]) {
    this.config = config;
        databases.forEach(db => {
      this.pools[db] = new Pool({ ...config, database: db });
      this.setupPoolEvents(this.pools[db], db);
    });
    
  }

    private setupPoolEvents(pool: Pool, dbName: string): void {
    pool.on('connect', () => {
      logger.info(`✅ Conexión establecida en base: ${dbName}`);
    });

    pool.on('error', (err) => {
      logger.error(`❌ Error en el pool de PostgreSQL (${dbName}):`, err);
    });
  }

    getPool(databaseName: string): Pool {
    if (!this.pools[databaseName]) {
      throw new Error(`No existe pool para la base: ${databaseName}`);
    }
    return this.pools[databaseName];
  }


    async testDatabase(databaseName: string) {
    const pool = this.getPool(databaseName);
    const res = await pool.query('SELECT NOW() as current_time');
    return res.rows[0];
  }

async connectAll(): Promise<void> {
  for (const [dbName, pool] of Object.entries(this.pools)) {
    try {
      const client = await pool.connect();
      client.release();
      logger.info(`✅ Conexión establecida correctamente en la base: ${dbName}`);
    } catch (error) {
      logger.error(`❌ Error conectando a la base ${dbName}:`, error);
      throw error;
    }
  }
}


  async listDatabases(): Promise<string[]> {
    return Object.keys(this.pools);
  }

  async getDatabaseInfo(databaseName: string): Promise<DatabaseInfo> {
    const pool = this.getPool(databaseName);
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.table_name);

    return {
      name: databaseName,
      description: `Base de datos ${databaseName}`,
      tables
    };
  }

  async searchAcrossDatabases(searchTerm: string, limit: number = 50): Promise<any[]> {
    const databases = await this.listDatabases();
    const allResults: any[] = [];

    for (const dbName of databases) {
      try {
        const dbResults = await this.searchInDatabase(dbName, searchTerm, limit);
        allResults.push(...dbResults.map(result => ({
          ...result,
          database: dbName
        })));
      } catch (error) {
        logger.warn(`Error buscando en base de datos ${dbName}:`, error);
        // Continuar con la siguiente base de datos
      }
    }

    return allResults;
  }




  async searchInDatabase(databaseName: string, searchTerm: string, limit: number = 20): Promise<any[]> {
    const tempPool = new Pool({
      ...this.config,
      database: databaseName
    });

    try {
      // Obtener todas las tablas de la base de datos
      const tablesQuery = `
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND data_type IN ('character varying', 'text', 'varchar')
        ORDER BY table_name, ordinal_position
      `;

      const tablesResult = await tempPool.query(tablesQuery);
      
      if (tablesResult.rows.length === 0) {
        return [];
      }

      // Agrupar columnas por tabla
      const tableColumns: { [table: string]: string[] } = {};
      tablesResult.rows.forEach(row => {
        if (!tableColumns[row.table_name]) {
          tableColumns[row.table_name] = [];
        }
        tableColumns[row.table_name].push(row.column_name);
      });

      // Buscar en cada tabla
      const results: any[] = [];

      for (const [tableName, columns] of Object.entries(tableColumns)) {
        try {
          const whereClauses = columns.map(col => 
            `${col}::text ILIKE $1`
          ).join(' OR ');

          const query = `
            SELECT * FROM "${tableName}"
            WHERE ${whereClauses}
            LIMIT $2
          `;

          const searchPattern = `%${searchTerm}%`;
          const tableResults = await tempPool.query(query, [searchPattern, limit]);

          if (tableResults.rows.length > 0) {
            results.push({
              table: tableName,
              records: tableResults.rows,
              matchCount: tableResults.rows.length
            });
          }
        } catch (error) {
          logger.debug(`Error buscando en tabla ${tableName}:`, error);
          // Continuar con la siguiente tabla
        }
      }

      return results;

    } finally {
      await tempPool.end();
    }
  }

  async countOccurrences(searchTerm: string): Promise<{ total: number; byDatabase: { [db: string]: number } }> {
    const databases = await this.listDatabases();
    const counts: { [db: string]: number } = {};
    let total = 0;

    for (const dbName of databases) {
      try {
        const dbCount = await this.countInDatabase(dbName, searchTerm);
        counts[dbName] = dbCount;
        total += dbCount;
      } catch (error) {
        logger.warn(`Error contando en base de datos ${dbName}:`, error);
        counts[dbName] = 0;
      }
    }

    return { total, byDatabase: counts };
  }

  async countInDatabase(databaseName: string, searchTerm: string): Promise<number> {
    const tempPool = new Pool({
      ...this.config,
      database: databaseName
    });

    try {
      const tablesQuery = `
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND data_type IN ('character varying', 'text', 'varchar')
      `;

      const tablesResult = await tempPool.query(tablesQuery);
      
      if (tablesResult.rows.length === 0) {
        return 0;
      }

      let totalCount = 0;

      // Agrupar columnas por tabla
      const tableColumns: { [table: string]: string[] } = {};
      tablesResult.rows.forEach(row => {
        if (!tableColumns[row.table_name]) {
          tableColumns[row.table_name] = [];
        }
        tableColumns[row.table_name].push(row.column_name);
      });

      for (const [tableName, columns] of Object.entries(tableColumns)) {
        try {
          const whereClauses = columns.map(col => 
            `${col}::text ILIKE $1`
          ).join(' OR ');

          const query = `
            SELECT COUNT(*) as count FROM "${tableName}"
            WHERE ${whereClauses}
          `;

          const searchPattern = `%${searchTerm}%`;
          const countResult = await tempPool.query(query, [searchPattern]);

          totalCount += parseInt(countResult.rows[0].count);
        } catch (error) {
          // Continuar con la siguiente tabla
          continue;
        }
      }

      return totalCount;

    } finally {
      await tempPool.end();
    }
  }

  async closeAll(): Promise<void> {
    for (const [dbName, pool] of Object.entries(this.pools)) {
      await pool.end();
      logger.info(`Pool cerrado para la base: ${dbName}`);
    }
  }

}

// Singleton
let databaseManager: DatabaseManager | null = null;

export const getDatabaseManager = (config?: DatabaseConfig, databases?: string[]): DatabaseManager => {
  if (!databaseManager) {
    if (!config || !databases) {
      throw new Error('Se requiere la configuración de BD y la lista de bases para inicializar');
    }
    databaseManager = new DatabaseManager(config, databases);
  }
  return databaseManager;
};

// Inicialización principal
export const initializeDatabase = async (): Promise<DatabaseManager> => {
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  throw new Error('Faltan variables de entorno para la base de datos');
}


  const config: DatabaseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};


  // Lista de bases activas
  //const databases = ['geoportal_electoral']; 
  // Si quieres habilitar otras bases, agregalas aquí:
   const databases = ['geoportal_electoral', 'formulario', 'db_fijo_ac'];

  databaseManager = new DatabaseManager(config, databases);

  // Test de conexión a cada base
  for (const db of databases) {
    await databaseManager.testDatabase(db);
  }

  return databaseManager;
};