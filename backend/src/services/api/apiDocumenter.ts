import { APIConfig, EndpointConfig } from '../../config/apis.config';
import { OpenAPIV3 } from 'openapi-types';
import  logger  from '../../utils/logger';


export class APIDocumenter {
  generateSwaggerDocument(apiConfig: APIConfig, endpoints: EndpointConfig[]): OpenAPIV3.Document {
    const document: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: apiConfig.name,
        version: '1.0.0',
        description: apiConfig.description
      },
      servers: [
        {
          url: apiConfig.baseUrl,
          description: `Servidor ${apiConfig.name}`
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: this.generateSecuritySchemes(apiConfig)
      }
    };

    for (const endpoint of endpoints) {
      this.addEndpointToDocument(document, endpoint);
    }

    return document;
  }

  private addEndpointToDocument(document: OpenAPIV3.Document, endpoint: EndpointConfig): void {
    if (!document.paths) document.paths = {};
    
    const path = endpoint.path;
    const method = endpoint.method.toLowerCase() as keyof OpenAPIV3.PathItemObject;
    
    if (!document.paths[path]) {
      document.paths[path] = {};
    }

   (document.paths[path] as OpenAPIV3.PathItemObject)[method as 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace'] = {
  summary: endpoint.description,
  tags: [this.extractTagFromPath(path)],
  parameters: endpoint.parameters?.map(param => ({
    name: param.name,
    in: param.in as any,
    description: param.description,
    required: param.required,
    schema: { type: param.type }
  })),
  responses: {
    '200': {
      description: 'Success',
      content: {
        'application/json': {
          schema: endpoint.responseSchema || { type: 'object' }
        }
      }
    }
  }
} as OpenAPIV3.OperationObject;
  }

  private extractTagFromPath(path: string): string {
    const parts = path.split('/').filter(part => part);
    return parts[0] || 'general';
  }

private generateSecuritySchemes(apiConfig: APIConfig): OpenAPIV3.ComponentsObject['securitySchemes'] {
    if (!apiConfig.authentication) return undefined;

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

  generateMarkdownDocumentation(apiConfig: APIConfig, endpoints: EndpointConfig[]): string {
    let markdown = `# ${apiConfig.name}\n\n`;
    markdown += `**Descripción:** ${apiConfig.description}\n\n`;
    markdown += `**URL Base:** ${apiConfig.baseUrl}\n\n`;

    markdown += '## Endpoints\n\n';

    for (const endpoint of endpoints) {
      markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
      markdown += `${endpoint.description}\n\n`;

      if (endpoint.parameters && endpoint.parameters.length > 0) {
        markdown += '**Parámetros:**\n\n';
        markdown += '| Nombre | Tipo | Requerido | Descripción |\n';
        markdown += '|--------|------|-----------|-------------|\n';
        
        for (const param of endpoint.parameters) {
          markdown += `| ${param.name} | ${param.type} | ${param.required ? 'Sí' : 'No'} | ${param.description} |\n`;
        }
        markdown += '\n';
      }

      markdown += '---\n\n';
    }

    return markdown;
  }

  /**
   * Consolidate paths from multiple APIs
   */
  consolidatePaths(endpoints: any[]): Record<string, any> {
    const paths: Record<string, any> = {};
    
    endpoints.forEach(endpoint => {
      const pathKey = `${endpoint.api}:${endpoint.path}`;
      if (!paths[pathKey]) {
        paths[pathKey] = {};
      }
      
      const method = endpoint.method.toLowerCase();
      paths[pathKey][method] = {
        summary: endpoint.description,
        tags: [endpoint.api],
        parameters: endpoint.parameters || [],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: endpoint.responseSchema || { type: 'object' }
              }
            }
          }
        }
      };
    });
    
    return paths;
  }

  /**
   * Consolidate security schemes from multiple APIs
   */
  consolidateSecuritySchemes(apis: APIConfig[]): Record<string, any> {
    const securitySchemes: Record<string, any> = {};
    
    apis.forEach(api => {
      if (api.authentication) {
        const schemeName = `${api.id}_auth`;
        
        switch (api.authentication.type) {
          case 'bearer':
            securitySchemes[schemeName] = {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            };
            break;
          case 'apiKey':
            securitySchemes[schemeName] = {
              type: 'apiKey',
              in: 'header',
              name: api.authentication.key || 'X-API-Key'
            };
            break;
          case 'oauth2':
            securitySchemes[schemeName] = {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: api.authentication.tokenUrl,
                  scopes: api.authentication.scopes || {}
                }
              }
            };
            break;
        }
      }
    });
    
    return securitySchemes;
  }

}