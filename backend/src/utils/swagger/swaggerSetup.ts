import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';
import { logger } from '../logger';

const projectRoot = process.cwd();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
       info: {
      title: 'APIs Empresariales Bispace®',
      version: '1.0.0',
      description: `
        Bienvenido a la plataforma centralizada de APIs de Bispace®.
        🚀 Empresa dedicada a la integración de soluciones digitales.
        📌 Contacto: soporte@bispace.site
      `,
      contact: {
        name: 'Bispace®',
        url: 'https://bispace.site',
        email: 'info@bispace.site'
      },
      license: {
        name: "Propiedad de Bispace®",
        url: "https://bispace.site/legal"
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.tudominio.com',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Token de API para autenticación'
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticación'
        }
      },
      schemas: {
        // Esquemas de API
        APIConfig: {
          type: 'object',
          required: ['id', 'name', 'baseUrl', 'description'],
          properties: {
            id: {
              type: 'string',
              description: 'Identificador único de la API',
              example: 'sabi'
            },
            name: {
              type: 'string',
              description: 'Nombre descriptivo de la API',
              example: 'Sistema de Activos'
            },
            baseUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL base de la API',
              example: 'https://sabi-api.example.com'
            },
            description: {
              type: 'string',
              description: 'Descripción de la API',
              example: 'Sistema de gestión de activos empresariales'
            },
            type: {
              type: 'string',
              description: 'Tipo de API',
              example: 'assets'
            },
            active: {
              type: 'boolean',
              description: 'Estado activo/inactivo de la API',
              example: true
            },
            endpoints: {
              type: 'array',
              description: 'Endpoints disponibles de la API',
              items: {
                $ref: '#/components/schemas/APIEndpointConfig'
              }
            },
            keywords: {
              type: 'array',
              description: 'Palabras clave para detección automática',
              items: {
                type: 'string'
              },
              example: ['usuario', 'activo', 'asset']
            },
            synonyms: {
              type: 'array',
              description: 'Sinónimos para detección automática',
              items: {
                type: 'string'
              },
              example: ['inventario', 'patrimonio', 'bienes']
            },
            headers: {
              type: 'object',
              description: 'Headers adicionales para las requests',
              additionalProperties: {
                type: 'string'
              }
            },
            healthEndpoint: {
              type: 'string',
              description: 'Endpoint para health check',
              example: '/health'
            },
            rateLimit: {
              type: 'object',
              description: 'Configuración de rate limiting',
              properties: {
                enabled: {
                  type: 'boolean'
                },
                maxRequests: {
                  type: 'integer'
                },
                timeWindow: {
                  type: 'integer'
                }
              }
            },
            retryPolicy: {
              type: 'object',
              description: 'Configuración de reintentos',
              properties: {
                maxRetries: {
                  type: 'integer'
                },
                retryDelay: {
                  type: 'integer'
                },
                retryOn: {
                  type: 'array',
                  items: {
                    type: 'integer'
                  }
                }
              }
            },
            timeout: {
              type: 'integer',
              description: 'Timeout en milisegundos para requests',
              example: 30000
            },
            cacheEnabled: {
              type: 'boolean',
              description: 'Habilitar caché',
              example: false
            },
            defaultCacheTTL: {
              type: 'integer',
              description: 'TTL por defecto del caché en segundos',
              example: 300
            },
            metadata: {
              type: 'object',
              description: 'Metadatos adicionales',
              additionalProperties: true
            }
          }
        },
        APIEndpointConfig: {
          type: 'object',
          required: ['path', 'description'],
          properties: {
            path: {
              type: 'string',
              description: 'Ruta del endpoint',
              example: '/usuarios'
            },
            description: {
              type: 'string',
              description: 'Descripción del endpoint',
              example: 'Obtiene lista de usuarios del sistema'
            },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
              description: 'Método HTTP del endpoint',
              example: 'GET'
            },
            parameters: {
              type: 'object',
              description: 'Parámetros del endpoint',
              additionalProperties: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string'
                  },
                  required: {
                    type: 'boolean'
                  },
                  description: {
                    type: 'string'
                  },
                  example: {
                    type: 'string'
                  }
                }
              }
            },
            responseFormatter: {
              type: 'string',
              enum: ['list', 'cantidad', 'electoral', 'detail', 'raw'],
              description: 'Formateador de respuesta',
              example: 'list'
            },
            requiresAuth: {
              type: 'boolean',
              description: 'Requiere autenticación',
              example: true
            },
            timeout: {
              type: 'integer',
              description: 'Timeout específico para este endpoint',
              example: 10000
            },
            cacheable: {
              type: 'boolean',
              description: 'Permite caché para este endpoint',
              example: true
            },
            cacheTTL: {
              type: 'integer',
              description: 'TTL del caché en segundos',
              example: 300
            }
          }
        },
        APIStatus: {
          type: 'object',
          required: ['id', 'status', 'timestamp'],
          properties: {
            id: {
              type: 'string',
              description: 'ID de la API',
              example: 'sabi'
            },
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy', 'unknown', 'degraded'],
              description: 'Estado de salud de la API',
              example: 'healthy'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp del chequeo'
            },
            responseTime: {
              type: 'number',
              description: 'Tiempo de respuesta en ms',
              example: 150
            },
            error: {
              type: 'string',
              description: 'Mensaje de error (si aplica)',
              example: 'Connection timeout'
            },
            lastChecked: {
              type: 'string',
              format: 'date-time',
              description: 'Última vez que se chequeó'
            },
            successRate: {
              type: 'number',
              description: 'Porcentaje de éxito',
              example: 95.5
            },
            totalRequests: {
              type: 'integer',
              description: 'Total de requests realizados',
              example: 1000
            },
            failedRequests: {
              type: 'integer',
              description: 'Total de requests fallidos',
              example: 45
            }
          }
        },
        // Esquemas de Chat
        ChatMessage: {
          type: 'object',
          required: ['role', 'content'],
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'assistant', 'system'],
              description: 'Rol del mensaje'
            },
            content: {
              type: 'string',
              description: 'Contenido del mensaje'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp del mensaje'
            }
          }
        },
        ChatRequest: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje del usuario para procesar'
            },
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ChatMessage'
              },
              description: 'Historial de mensajes para conversación'
            },
            model: {
              type: 'string',
              enum: ['gemini', 'claude'],
              description: 'Modelo de IA a utilizar',
              example: 'gemini'
            },
            apiId: {
              type: 'string',
              description: 'ID de API específica a consultar',
              example: 'sabi'
            },
            temperature: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Creatividad de la respuesta (0 = preciso, 1 = creativo)',
              example: 0.7
            },
            maxTokens: {
              type: 'integer',
              description: 'Máximo número de tokens en la respuesta',
              example: 1000
            },
            timeout: {
              type: 'integer',
              description: 'Timeout personalizado en milisegundos',
              example: 30000
            }
          }
        },
        ChatResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la solicitud fue exitosa',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                response: {
                  type: 'string',
                  description: 'Respuesta del modelo de IA'
                },
                processingTime: {
                  type: 'string',
                  description: 'Tiempo de procesamiento en formato legible',
                  example: '1250ms'
                },
                usedModel: {
                  type: 'string',
                  description: 'Modelo utilizado para la respuesta',
                  example: 'gemini'
                },
                apiData: {
                  type: 'string',
                  description: 'Información sobre la API utilizada',
                  example: 'Datos de API: sabi'
                },
                relevantAPIs: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'APIs relevantes detectadas',
                  example: ['sabi']
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp de la respuesta'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Mensaje de error'
            },
            message: {
              type: 'string',
              description: 'Descripción adicional del error'
            },
            code: {
              type: 'string',
              description: 'Código de error'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp del error'
            },
            details: {
              type: 'object',
              description: 'Detalles adicionales del error',
              additionalProperties: true
            }
          }
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string'
                  },
                  status: {
                    type: 'string'
                  },
                  responseTime: {
                    type: 'number'
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        SuccessResponse: {
          description: 'Respuesta exitosa',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  data: {
                    type: 'object',
                    additionalProperties: true
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        ErrorResponse: {
          description: 'Error en la solicitud',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        ValidationError: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Validation Error',
                message: 'Invalid input data',
                details: {
                  field: 'email',
                  error: 'Must be a valid email address'
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Not Found',
                message: 'The requested resource was not found'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Límite de tasa excedido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Rate Limit Exceeded',
                message: 'Too many requests, please try again later'
              }
            }
          }
        }
      },
      parameters: {
        ApiIdParam: {
          in: 'path',
          name: 'apiId',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'ID de la API'
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Número máximo de resultados a devolver'
        },
        PageParam: {
          in: 'query',
          name: 'page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Número de página para paginación'
        }
      }
    },
    tags: [
      {
        name: 'APIs',
        description: 'Gestión y monitoreo de APIs registradas'
      },
      {
        name: 'Chat',
        description: 'Endpoints para chat con IA'
      },
      {
        name: 'System',
        description: 'Endpoints del sistema y health checks'
      }
    ],
    externalDocs: {
      description: 'Documentación adicional',
      url: 'https://docs.apiassistant.com'
    }
  },
  apis: [
    path.join(projectRoot, 'src', 'routes', '*.ts'),
    path.join(projectRoot, 'src', 'controllers', '*.ts'),
    path.join(projectRoot, 'src', 'swagger', 'docs', '*.yaml')
  ]
};

export const setupSwagger = (app: Express): void => {
  try {
    const swaggerSpec = swaggerJsdoc(options);
    
    // Middleware para servir la UI de Swagger
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #333; }
        .swagger-ui .btn { background-color: #4CAF50; }
      `,
      customSiteTitle: 'API Assistant - Documentación',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true
      }
    }));

    // Endpoint para obtener el spec en JSON
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    logger.info('Swagger documentation available at /api-docs');
  } catch (error) {
    logger.error('Error setting up Swagger:', error);
    
    // Fallback básico en caso de error
    const fallbackSpec = {
      openapi: '3.0.0',
      info: {
        title: 'API Assistant',
        version: '1.0.0',
        description: 'Documentación básica - Error al cargar la documentación completa'
      },
      paths: {}
    };
    
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(fallbackSpec));
    logger.warn('Using basic Swagger documentation due to setup error');
  }
};