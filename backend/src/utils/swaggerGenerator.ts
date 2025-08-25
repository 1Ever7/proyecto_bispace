import { OpenAPIV3 } from 'openapi-types';
import { APIConfig, EndpointConfig } from '../config/apis.config';
import  logger  from './logger';
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';


export async function testSabiConnection(): Promise<boolean> {
  try {
    // Por ejemplo, hacer un GET simple al endpoint base de Sabi
    const response = await axios.get('https://sabi.bispace.site/api/usr');
    return response.status === 200;
  } catch (error) {
    logger.error('Error conectando con Sabi:', error);
    return false;
  }
}

export class SwaggerGenerator {
  /**
   * Genera un documento OpenAPI completo a partir de la configuración de API
   */
  generateOpenAPIDocument(apiConfig: APIConfig, endpoints: EndpointConfig[]): OpenAPIV3.Document {
    try {
      const document: OpenAPIV3.Document = {
        openapi: '3.0.0',
        info: {
          title: apiConfig.name,
          version: '1.0.0',
          description: apiConfig.description,
          contact: {
            name: 'API Support',
            email: 'support@empresa.com'
          }
        },
        servers: [
          {
            url: apiConfig.baseUrl,
            description: `Servidor principal de ${apiConfig.name}`
          }
        ],
        paths: this.generatePaths(endpoints),
        components: {
          schemas: this.generateSchemas(endpoints),
          securitySchemes: this.generateSecuritySchemes(apiConfig),
          responses: this.generateStandardResponses()
        },
        tags: this.generateTags(endpoints)
      };

      logger.info(`Documentación OpenAPI generada para ${apiConfig.name} con ${endpoints.length} endpoints`);
      return document;
    } catch (error) {
      logger.error('Error generando documentación OpenAPI:', error);
      throw error;
    }
  }

  /**
   * Genera el objeto paths para OpenAPI a partir de los endpoints
   */
  private generatePaths(endpoints: EndpointConfig[]): OpenAPIV3.PathsObject {
    const paths: OpenAPIV3.PathsObject = {};

    endpoints.forEach(endpoint => {
      const normalizedPath = this.normalizePath(endpoint.path);
      
      if (!paths[normalizedPath]) {
        paths[normalizedPath] = {};
      }

  const method = endpoint.method.toLowerCase() as
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head'
  | 'trace';

(paths[normalizedPath] as OpenAPIV3.PathItemObject)[method] = {
  summary: endpoint.description,
  operationId: this.generateOperationId(normalizedPath, method),
  tags: [this.extractTagFromPath(normalizedPath)],
  parameters: this.generateParameters(endpoint.parameters),
  responses: this.generateResponses(endpoint),
  security: this.generateSecurityRequirements(endpoint)
} as OpenAPIV3.OperationObject;

    });

    return paths;
  }

  /**
   * Normaliza el path para que sea compatible con OpenAPI
   */
  private normalizePath(path: string): string {
    // Asegurar que el path comience con /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Reemplazar parámetros de ruta con formato OpenAPI
    path = path.replace(/:(\w+)/g, '{$1}');
    
    return path;
  }

  /**
   * Genera un ID de operación único para cada endpoint
   */
  private generateOperationId(path: string, method: string): string {
    const cleanPath = path
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    return `${method}_${cleanPath}`.toLowerCase();
  }

  /**
   * Extrae un tag del path para organizar las operaciones
   */
  private extractTagFromPath(path: string): string {
    const segments = path.split('/').filter(segment => segment && !segment.startsWith('{'));
    return segments[0] || 'general';
  }

  /**
   * Genera parámetros OpenAPI a partir de la configuración
   */
  private generateParameters(parameters?: any[]): OpenAPIV3.ParameterObject[] {
    if (!parameters || parameters.length === 0) {
      return [];
    }

    return parameters.map(param => ({
      name: param.name,
      in: param.in || 'query',
      description: param.description,
      required: param.required || false,
      schema: {
        type: param.type || 'string',
        enum: param.enum,
        default: param.default
      },
      example: param.example
    }));
  }

  /**
   * Genera respuestas OpenAPI para un endpoint
   */
  private generateResponses(endpoint: EndpointConfig): OpenAPIV3.ResponsesObject {
    return {
      '200': {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: endpoint.responseSchema || { type: 'object' }
          }
        }
      },
      '400': {
        description: 'Invalid input',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      '500': {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Genera esquemas de componentes OpenAPI
   */
private generateSchemas(endpoints: EndpointConfig[]): OpenAPIV3.ComponentsObject['schemas'] {
  const schemas: OpenAPIV3.ComponentsObject['schemas'] = {
    Error: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object' }
      }
    },
    Success: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' }
      }
    }
  };

  return schemas;
}

  /**
   * Genera esquemas de seguridad OpenAPI
   */
private generateSecuritySchemes(apiConfig: APIConfig): OpenAPIV3.ComponentsObject['securitySchemes'] {
    if (!apiConfig.authentication) {
      return undefined;
    }

    switch (apiConfig.authentication.type) {
      case 'bearer':
        return {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        };
      
      case 'apiKey':
        return {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: apiConfig.authentication.key || 'X-API-Key'
          }
        };
      
      default:
        return undefined;
    }
  }

  /**
   * Genera requisitos de seguridad para los endpoints
   */
  private generateSecurityRequirements(endpoint: EndpointConfig): OpenAPIV3.SecurityRequirementObject[] | undefined {
    // Aquí puedes definir qué endpoints requieren autenticación
    const securedEndpoints = ['/usr', '/activo', '/funcionario'];
    
    if (securedEndpoints.includes(endpoint.path)) {
      return [{ BearerAuth: [] }];
    }
    
    return undefined;
  }

  /**
   * Genera respuestas estándar para reutilizar
   */
private generateStandardResponses(): OpenAPIV3.ComponentsObject['responses'] {
    return {
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Not Found',
              message: 'The requested resource was not found'
            }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized access',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Unauthorized',
              message: 'Authentication credentials were missing or invalid'
            }
          }
        }
      }
    };
  }

  /**
   * Genera tags para organizar las operaciones
   */
  private generateTags(endpoints: EndpointConfig[]): OpenAPIV3.TagObject[] {
    const tagsMap = new Map<string, string>();
    
    endpoints.forEach(endpoint => {
      const tag = this.extractTagFromPath(endpoint.path);
      if (!tagsMap.has(tag)) {
        tagsMap.set(tag, `${tag} operations`);
      }
    });
    
    return Array.from(tagsMap.entries()).map(([name, description]) => ({
      name,
      description
    }));
  }

  /**
   * Exporta la documentación OpenAPI a un archivo YAML
   */
  async exportToYAML(document: OpenAPIV3.Document, filePath: string): Promise<void> {
  try {
    // Crear directorio si no existe
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const yamlString = yaml.stringify(document);
    fs.writeFileSync(filePath, yamlString, 'utf8');
    logger.info(`Documentación OpenAPI exportada a: ${filePath}`);
  } catch (error) {
    logger.error('Error exportando documentación YAML:', error);
    throw error;
  }
}

  /**
   * Exporta la documentación OpenAPI a un archivo JSON
   */
  async exportToJSON(document: OpenAPIV3.Document, filePath: string): Promise<void> {
  try {
    // Crear directorio si no existe
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const jsonString = JSON.stringify(document, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');
    logger.info(`Documentación OpenAPI exportada a: ${filePath}`);
  } catch (error) {
    logger.error('Error exportando documentación JSON:', error);
    throw error;
  }
}

  /**
   * Genera documentación en formato Markdown para fácil lectura
   */
  generateMarkdownDocumentation(apiConfig: APIConfig, endpoints: EndpointConfig[]): string {
    let markdown = `# ${apiConfig.name}\n\n`;
    markdown += `**Descripción:** ${apiConfig.description}\n\n`;
    markdown += `**URL Base:** ${apiConfig.baseUrl}\n\n`;

    // Agrupar endpoints por tag
    const endpointsByTag = new Map<string, EndpointConfig[]>();
    
    endpoints.forEach(endpoint => {
      const tag = this.extractTagFromPath(endpoint.path);
      if (!endpointsByTag.has(tag)) {
        endpointsByTag.set(tag, []);
      }
      endpointsByTag.get(tag)!.push(endpoint);
    });

    // Generar sección para cada tag
    endpointsByTag.forEach((tagEndpoints, tag) => {
      markdown += `## ${tag.toUpperCase()}\n\n`;
      
      tagEndpoints.forEach(endpoint => {
        markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
        markdown += `${endpoint.description}\n\n`;
        
        if (endpoint.parameters && endpoint.parameters.length > 0) {
          markdown += `**Parámetros:**\n\n`;
          markdown += `| Nombre | Tipo | Requerido | Descripción |\n`;
          markdown += `|--------|------|-----------|-------------|\n`;
          
          endpoint.parameters.forEach(param => {
            markdown += `| ${param.name} | ${param.type} | ${param.required ? 'Sí' : 'No'} | ${param.description} |\n`;
          });
          
          markdown += `\n`;
        }
        
        markdown += `---\n\n`;
      });
    });

    return markdown;
  }

  /**
   * Exporta documentación Markdown a un archivo
   */
  async exportMarkdownToFile(markdown: string, filePath: string): Promise<void> {
    try {
      fs.writeFileSync(filePath, markdown, 'utf8');
      logger.info(`Documentación Markdown exportada a: ${filePath}`);
    } catch (error) {
      logger.error('Error exportando documentación Markdown:', error);
      throw error;
    }
  }
}

// Instancia singleton para uso global
export const swaggerGenerator = new SwaggerGenerator();