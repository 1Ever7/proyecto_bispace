import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { logger } from './logger';
import { OpenAPIV3 } from 'openapi-types';

export const setupSwagger = async (app: Express): Promise<void> => {
  try {
    logger.info('🔄 Configurando Swagger UI...');

    // Documentación completa con todas las rutas
    const swaggerDoc: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: 'API Assistant - Documentación Completa',
        version: '1.0.0',
        description: 'Sistema de documentación y consulta de APIs internas - Todas las rutas disponibles'
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3000}`,
          description: 'Servidor local'
        }
      ],
      paths: {
        // ==================== RUTAS DE CHAT ====================
        '/api/chat': {
          post: {
            summary: 'Responde preguntas sobre múltiples APIs',
            description: 'Permite hacer preguntas a la IA utilizando datos de APIs específicas. Puedes especificar una API concreta usando el parámetro apiId.',
            tags: ['Chat'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ChatRequest'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Respuesta generada por IA',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ChatResponse'
                    }
                  }
                }
              }
            }
          }
        },
        '/api/chat/status': {
          get: {
            summary: 'Verificar estado del servicio de chat',
            tags: ['Chat'],
            responses: {
              '200': {
                description: 'Servicio funcionando correctamente',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/chat/summary': {
          post: {
            summary: 'Obtener resumen de todos los sistemas disponibles',
            tags: ['Chat'],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      model: {
                        type: 'string',
                        enum: ['claude', 'gemini'],
                        default: 'claude'
                      }
                    }
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Resumen ejecutivo de sistemas',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        },

        // ==================== RUTAS DE API ====================
        '/api/query': {
          get: {
            summary: 'Consultar endpoint de API',
            description: 'Consultar datos directamente de las APIs internas',
            tags: ['API'],
            parameters: [
              {
                name: 'endpoint',
                in: 'query',
                required: true,
                schema: { type: 'string' },
                description: 'Endpoint a consultar (ej: /usr, /activo)',
                example: '/usr'
              },
              {
                name: 'apiId',
                in: 'query',
                required: false,
                schema: { 
                  type: 'string',
                  enum: ['sabi', 'trendvoto'], 
                  default: 'sabi'
                },
                description: 'ID de la API a consultar',
                example: 'sabi'
              }
            ],
            responses: {
              '200': {
                description: 'Consulta exitosa',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                        endpoint: { type: 'string' },
                        apiId: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/apis': {
          get: {
            summary: 'Listar todas las APIs disponibles',
            tags: ['API'],
            responses: {
              '200': {
                description: 'Lista de APIs configuradas',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/count': {
          get: {
            summary: 'Contar entidades en el sistema',
            tags: ['API'],
            parameters: [
              {
                name: 'entity',
                in: 'query',
                required: true,
                schema: { type: 'string' },
                description: 'Tipo de entidad (usuarios, activos, etc.)'
              }
            ],
            responses: {
              '200': {
                description: 'Conteo de entidades',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/docs': {
          get: {
            summary: 'Obtener documentación de APIs',
            tags: ['API'],
            parameters: [
              {
                name: 'format',
                in: 'query',
                required: false,
                schema: { type: 'string' },
                description: 'Formato de documentación (markdown, swagger)'
              }
            ],
            responses: {
              '200': {
                description: 'Documentación generada',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
// ==================== APIS ====================
'/api/api-ids': {
    get: {
      summary: 'Obtener lista de todos los apiIds disponibles',
      tags: ['API'],
      responses: {
        '200': {
          description: 'Lista de apiIds',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      apiIds: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    }
                  },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  },
        '/api/endpoints': {
          get: {
            summary: 'Listar endpoints disponibles',
            tags: ['API'],
            responses: {
              '200': {
                description: 'Lista de endpoints',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          // ==================== ESQUEMAS PARA CHAT ====================
          ChatRequest: {
            type: 'object',
            required: ['question'],
            properties: {
              question: {
                type: 'string',
                example: '¿Cómo crear un nuevo activo?'
              },
              model: {
                type: 'string',
                enum: ['claude', 'gemini', 'openai', 'deepseek'],
                default: 'claude'
              },
              apiId: {
                type: 'string',
                enum: ['sabi', 'trendvoto'],
                default: 'sabi',
                description: 'ID de la API específica a consultar'
              }
            }
          },
          ChatResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  answer: { type: 'string' },
                  context: { type: 'string' },
                  relevantAPIs: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  availableAPIs: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' }
                      }
                    }
                  },
                  specifiedAPI: { type: 'string' }
                }
              },
              timestamp: { type: 'string', format: 'date-time' }
            }
          },

          // ==================== ESQUEMAS GENERALES ====================
          ErrorResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          },
          APIResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      tags: [
        {
          name: 'Chat',
          description: 'Endpoints para interactuar con modelos de IA'
        },
        {
          name: 'API',
          description: 'Endpoints para consultar APIs directamente'
        }
      ]
    };

    // Configurar Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
    
    // Endpoint para JSON raw
    app.get('/api-docs/json', (req, res) => {
      res.json(swaggerDoc);
    });

    logger.info('✅ Swagger UI configurado en /api-docs');
    logger.info('✅ Swagger JSON disponible en /api-docs/json');
    logger.info('✅ Rutas documentadas: /api/chat, /api/chat/status, /api/chat/summary, /api/query, /api/apis, /api/count, /api/docs, /api/endpoints');

  } catch (error) {
    logger.error('❌ Error configurando Swagger:', error);
    
    // Configuración mínima de emergencia
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup({}));
    app.get('/api-docs/json', (req, res) => {
      res.json({ 
        error: 'Documentación no disponible temporalmente',
        timestamp: new Date().toISOString()
      });
    });
    
    logger.warn('⚠️ Swagger configurado en modo de emergencia');
  }
};