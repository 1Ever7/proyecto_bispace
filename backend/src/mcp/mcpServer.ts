import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListResourcesRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// Importaciones simples sin dependencias complejas
const apiConfigs = [
  {
    name: 'sabi',
    baseUrl: process.env.SABI_BASE_URL || 'https://sabi.bispace.site',
    type: 'json',
    description: 'Sistema de Administración de Bienes',
    endpoints: []
  },
  {
    name: 'rh',
    baseUrl: process.env.SABI_BASE_URL ? `${process.env.SABI_BASE_URL}/api/usr/` : 'https://sabi.bispace.site/api/usr/',
    type: 'json',
    description: 'API de Recursos Humanos',
    endpoints: []
  }
];

export class MCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'api-assistant',
        version: '1.0.0',
        description: 'Asistente para consultas de APIs internas'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Handler para listar herramientas
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'query_api',
          description: 'Consultar información sobre las APIs disponibles',
          inputSchema: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'Pregunta sobre las APIs disponibles'
              }
            },
            required: ['question'],
          },
        },
        {
          name: 'get_api_info',
          description: 'Obtener información de las APIs configuradas',
          inputSchema: {
            type: 'object',
            properties: {
              api_name: {
                type: 'string',
                enum: ['sabi', 'rh', 'all'],
                description: 'Nombre de la API'
              }
            },
            required: ['api_name'],
          },
        }
      ],
    }));

    // Handler para llamar a herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        
        switch (name) {
          case 'query_api':
            return await this.handleAPIQuery(args);
          case 'get_api_info':
            return await this.handleGetAPIInfo(args);
          default:
            throw new Error(`Herramienta no encontrada: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text', 
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    });

    // Handler para recursos
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'mcp://api-assistant/apis',
          name: 'APIs Disponibles',
          description: 'Lista de APIs configuradas en el sistema',
          mimeType: 'application/json'
        }
      ]
    }));
  }

  private async handleAPIQuery(args: any) {
    try {
      const { question } = args;
      
      if (!question) {
        throw new Error('La pregunta es requerida');
      }

      // Respuesta simple sin depender de APIs externas
      const response = `Consulta recibida: "${question}". 

APIs disponibles:
- Sabi API: ${apiConfigs[0].baseUrl}
- RH API: ${apiConfigs[1].baseUrl}

Nota: La integración con Claude está temporalmente deshabilitada debido a verificación de cuenta.`;

      return {
        content: [{ type: 'text', text: response }]
      };
    } catch (error) {
      throw new Error(`Error en query_api: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleGetAPIInfo(args: any) {
    try {
      const { api_name } = args;
      
      if (!api_name) {
        throw new Error('El nombre de la API es requerido');
      }

      let apiInfo;
      if (api_name === 'all') {
        apiInfo = apiConfigs.map(api => ({
          name: api.name,
          baseUrl: api.baseUrl,
          description: api.description
        }));
      } else {
        apiInfo = apiConfigs.find(api => api.name === api_name);
        if (!apiInfo) {
          throw new Error(`API no encontrada: ${api_name}`);
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(apiInfo, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Error en get_api_info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      // Mantener el proceso vivo
      process.stdin.resume();
      
    } catch (error) {
      // Error en formato JSON para MCP
      process.stderr.write(JSON.stringify({
        error: `Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`
      }));
      process.exit(1);
    }
  }
}

// Ejecutar solo si es el módulo principal
if (require.main === module) {
  const server = new MCPServer();
  server.run();
}



/*// src/mcp/MCPServer.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { APIManager } from '../services/api/APIManager';
import { logger } from '../utils/logger';

export class MCPServer {
  private server: Server;
  private apiManager: APIManager;

  constructor() {
    this.server = new Server(
      {
        name: 'api-assistant',
        version: '1.0.0',
        description: 'Asistente para consultas de APIs internas con documentación automática'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        },
      }
    );

    this.apiManager = new APIManager();
    this.setupHandlers();
  }

  private setupHandlers() {
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
          name: 'get_api_info',
          description: 'Obtener información detallada de una API específica',
          inputSchema: {
            type: 'object',
            properties: {
              api_id: {
                type: 'string',
                description: 'ID de la API (ej: sabi, rh)'
              }
            },
            required: ['api_id'],
          },
        },
        {
          name: 'get_api_documentation',
          description: 'Obtener documentación de una API en formato OpenAPI o Markdown',
          inputSchema: {
            type: 'object',
            properties: {
              api_id: {
                type: 'string',
                description: 'ID de la API'
              },
              format: {
                type: 'string',
                enum: ['openapi', 'markdown'],
                description: 'Formato de documentación',
                default: 'openapi'
              }
            },
            required: ['api_id'],
          },
        },
        {
          name: 'get_consolidated_documentation',
          description: 'Obtener documentación consolidada de todas las APIs',
          inputSchema: {
            type: 'object',
            properties: {
              format: {
                type: 'string',
                enum: ['openapi', 'markdown'],
                description: 'Formato de documentación',
                default: 'openapi'
              }
            }
          },
        },
        {
          name: 'query_api',
          description: 'Consultar un endpoint específico de una API',
          inputSchema: {
            type: 'object',
            properties: {
              api_id: {
                type: 'string',
                description: 'ID de la API'
              },
              endpoint: {
                type: 'string',
                description: 'Endpoint a consultar (ej: /usr, /activo)'
              },
              parameters: {
                type: 'object',
                description: 'Parámetros de consulta'
              }
            },
            required: ['api_id', 'endpoint'],
          },
        },
        {
          name: 'ask_about_apis',
          description: 'Hacer una pregunta sobre las APIs disponibles',
          inputSchema: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'Pregunta sobre las APIs'
              }
            },
            required: ['question'],
          },
        }
      ],
    }));

    // Handler para llamar a herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        
        switch (name) {
          case 'list_apis':
            return await this.handleListAPIs();
          case 'get_api_info':
            return await this.handleGetAPIInfo(args);
          case 'get_api_documentation':
            return await this.handleGetAPIDocumentation(args);
          case 'get_consolidated_documentation':
            return await this.handleGetConsolidatedDocumentation(args);
          case 'query_api':
            return await this.handleQueryAPI(args);
          case 'ask_about_apis':
            return await this.handleAskAboutAPIs(args);
          default:
            throw new Error(`Herramienta no encontrada: ${name}`);
        }
      } catch (error) {
        logger.error(`Error en herramienta ${name}:`, error);
        return {
          content: [{
            type: 'text', 
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    });

    // Handler para recursos
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'mcp://api-assistant/apis',
          name: 'APIs Disponibles',
          description: 'Lista de todas las APIs configuradas en el sistema',
          mimeType: 'application/json'
        },
        {
          uri: 'mcp://api-assistant/consolidated-docs',
          name: 'Documentación Consolidada',
          description: 'Documentación unificada de todas las APIs',
          mimeType: 'application/json'
        }
      ]
    }));

    // Handler para leer recursos
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        if (uri === 'mcp://api-assistant/apis') {
          const apis = await this.apiManager.getAllAPIs();
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(apis, null, 2)
            }]
          };
        } else if (uri === 'mcp://api-assistant/consolidated-docs') {
          const docs = await this.apiManager.getConsolidatedDocumentation('openapi');
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(docs, null, 2)
            }]
          };
        } else {
          throw new Error(`Recurso no encontrado: ${uri}`);
        }
      } catch (error) {
        logger.error(`Error leyendo recurso ${uri}:`, error);
        throw error;
      }
    });
  }

  private async handleListAPIs() {
    const apis = await this.apiManager.getAllAPIs();
    
    return {
      content: [{
        type: 'text',
        text: `APIs disponibles:\n\n${apis.map(api => 
          `- ${api.id}: ${api.name} (${api.baseUrl})\n  ${api.description}`
        ).join('\n\n')}`
      }]
    };
  }

  private async handleGetAPIInfo(args: any) {
    const { api_id } = args;
    
    if (!api_id) {
      throw new Error('El parámetro api_id es requerido');
    }

    const api = await this.apiManager.getAPI(api_id);
    if (!api) {
      throw new Error(`API no encontrada: ${api_id}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(api, null, 2)
      }]
    };
  }

  private async handleGetAPIDocumentation(args: any) {
    const { api_id, format = 'openapi' } = args;
    
    if (!api_id) {
      throw new Error('El parámetro api_id es requerido');
    }

    const documentation = await this.apiManager.getAPIDocumentation(api_id, format);
    
    return {
      content: [{
        type: 'text',
        text: format === 'openapi' ? JSON.stringify(documentation, null, 2) : documentation
      }]
    };
  }

  private async handleGetConsolidatedDocumentation(args: any) {
    const { format = 'openapi' } = args;
    const documentation = await this.apiManager.getConsolidatedDocumentation(format);
    
    return {
      content: [{
        type: 'text',
        text: format === 'openapi' ? JSON.stringify(documentation, null, 2) : documentation
      }]
    };
  }

  private async handleQueryAPI(args: any) {
    const { api_id, endpoint, parameters = {} } = args;
    
    if (!api_id || !endpoint) {
      throw new Error('Los parámetros api_id y endpoint son requeridos');
    }

    const result = await this.apiManager.queryAPI(api_id, endpoint, parameters);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  private async handleAskAboutAPIs(args: any) {
    const { question } = args;
    
    if (!question) {
      throw new Error('El parámetro question es requerido');
    }

    // Analizar la pregunta
    const analysis = await this.apiManager.analyzeQuestion(question);
    
    let response = `Análisis de la pregunta: "${question}"\n\n`;
    response += `- Intención: ${analysis.intent}\n`;
    response += `- API objetivo: ${analysis.targetAPI || 'No específicada'}\n`;
    response += `- Confianza: ${Math.round(analysis.confidence * 100)}%\n`;
    
    if (Object.keys(analysis.parameters).length > 0) {
      response += `- Parámetros detectados: ${JSON.stringify(analysis.parameters)}\n`;
    }

    // Según la intención, realizar acciones diferentes
    if (analysis.intent === 'documentation') {
      if (analysis.targetAPI) {
        const docs = await this.apiManager.getAPIDocumentation(analysis.targetAPI, 'markdown');
        response += `\nDocumentación de ${analysis.targetAPI}:\n\n${docs}`;
      } else {
        const docs = await this.apiManager.getConsolidatedDocumentation('markdown');
        response += `\nDocumentación consolidada:\n\n${docs}`;
      }
    } else if (analysis.intent === 'query' && analysis.targetAPI) {
      // Intentar encontrar el endpoint más relevante
      const api = await this.apiManager.getAPI(analysis.targetAPI);
      if (api && api.endpoints) {
        // Búsqueda simple de endpoints por palabras clave
        const keywords = question.toLowerCase().split(' ');
        const matchingEndpoints = api.endpoints.filter(endpoint => 
          keywords.some(keyword => 
            endpoint.path.toLowerCase().includes(keyword) || 
            endpoint.description.toLowerCase().includes(keyword)
          )
        );
        
        if (matchingEndpoints.length > 0) {
          response += `\Endpoints potencialmente relevantes:\n\n`;
          matchingEndpoints.forEach(endpoint => {
            response += `- ${endpoint.method} ${endpoint.path}: ${endpoint.description}\n`;
          });
        }
      }
    }

    return {
      content: [{
        type: 'text',
        text: response
      }]
    };
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info('✅ Servidor MCP iniciado correctamente');
      
      // Mantener el proceso vivo
      process.stdin.resume();
      
      process.on('SIGINT', () => {
        logger.info('Recibido SIGINT. Cerrando servidor MCP...');
        process.exit(0);
      });
      
    } catch (error) {
      logger.error('❌ Error al iniciar servidor MCP:', error);
      process.exit(1);
    }
  }
}

// Ejecutar solo si es el módulo principal
if (require.main === module) {
  const server = new MCPServer();
  server.run();
}*/