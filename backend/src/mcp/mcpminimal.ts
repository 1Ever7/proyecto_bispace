// src/mcp/mcpServer.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';
import https from 'https';

// Configura axios para ignorar certificados SSL (solo para desarrollo)
const agent = new https.Agent({ rejectUnauthorized: false });
axios.defaults.httpsAgent = agent;

interface APIConfig {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  type: string;
  endpoints?: any[];
}

class APIManager {
  private apis: APIConfig[] = [
    {
      id: 'sabi',
      name: 'Sabi API',
      description: 'API del sistema Sabi',
      baseUrl: 'https://sabi.bispace.site/api',
      type: 'REST',
      endpoints: [
        { path: '/usr', method: 'GET', description: 'Obtener usuarios' },
        { path: '/activo', method: 'GET', description: 'Obtener activos' },
        { path: '/geo/buscarEstado', method: 'GET', description: 'Buscar estado geográfico' }
      ]
    }
  ];

  async getAllAPIs(): Promise<APIConfig[]> {
    return this.apis;
  }

  async getAPI(apiId: string): Promise<APIConfig | null> {
    return this.apis.find(api => api.id === apiId) || null;
  }

  async queryAPI(apiId: string, endpointPath: string, params: any = {}): Promise<any> {
    const api = this.apis.find(a => a.id === apiId);
    if (!api) throw new Error(`API no encontrada: ${apiId}`);

    const url = `${api.baseUrl}${endpointPath}`;

    try {
      const response = await axios({
        method: 'GET',
        url,
        params,
        timeout: 30000
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Error HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`No se recibió respuesta del servidor: ${error.message}`);
      } else {
        throw new Error(`Error en la solicitud: ${error.message}`);
      }
    }
  }
}

export class MCPServer {
  private server: Server;
  private apiManager: APIManager;

  constructor() {
    this.server = new Server(
      {
        name: 'sabi-api-mcp',
        version: '1.0.0',
        description: 'MCP para consultas de API Sabi'
      },
      {
        capabilities: {
          tools: {}
        },
      }
    );

    this.apiManager = new APIManager();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.setupToolHandlers();
    this.setupErrorHandlers();
  }

  private setupToolHandlers() {
    // Handler para listar herramientas
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_apis',
          description: 'Listar todas las APIs disponibles en el sistema',
          inputSchema: {
            type: 'object',
            properties: {}
          },
        },
        {
          name: 'query_endpoint',
          description: 'Consultar un endpoint específico de una API',
          inputSchema: {
            type: 'object',
            properties: {
              api_id: {
                type: 'string',
                description: 'ID de la API (sabi)'
              },
              endpoint: {
                type: 'string',
                description: 'Endpoint a consultar (ej: /usr, /activo, /geo/buscarEstado)'
              },
              parameters: {
                type: 'object',
                description: 'Parámetros de consulta (JSON)'
              }
            },
            required: ['api_id', 'endpoint'],
          },
        }
      ],
    }));

    // Handler para llamar a herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'list_apis':
            return await this.handleListAPIs();
          case 'query_endpoint':
            return await this.handleQueryEndpoint(args);
          default:
            throw new Error(`Herramienta no encontrada: ${name}`);
        }
      } catch (error) {
        return this.handleToolError(error, name);
      }
    });
  }

  private setupErrorHandlers() {
    this.server.onerror = (error) => {
      console.error(`Error del servidor MCP: ${error.message}`);
    };
  }

  private async handleListAPIs() {
    const apis = await this.apiManager.getAllAPIs();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(apis, null, 2)
      }]
    };
  }

  private async handleQueryEndpoint(args: any) {
    const { api_id, endpoint, parameters = {} } = args;
    
    if (!api_id || !endpoint) {
      throw new Error('Los parámetros api_id y endpoint son requeridos');
    }

    if (!endpoint.startsWith('/')) {
      throw new Error('El endpoint debe comenzar con "/"');
    }

    const result = await this.apiManager.queryAPI(api_id, endpoint, parameters);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  private handleToolError(error: any, toolName: string) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error en herramienta ${toolName}: ${errorMessage}`);
    
    return {
      content: [{
        type: 'text', 
        text: `Error: ${errorMessage}`
      }],
      isError: true
    };
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      //console.log('Sabi MCP Server running...');
      
      // Mantener el proceso vivo
      process.stdin.resume();
      
      process.on('SIGINT', () => {
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        process.exit(0);
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error al iniciar servidor MCP: ${errorMessage}`);
      process.exit(1);
    }
  }
}

// Ejecutar solo si es el módulo principal
if (require.main === module) {
  const server = new MCPServer();
  server.run();
}