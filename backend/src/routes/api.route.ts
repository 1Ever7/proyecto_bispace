import { Router } from 'express';
import { apiController } from '../controllers/api.controller';
import { validateAPIRegistration } from '../middleware/validation/apiValidation';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: APIs
 *   description: Gestión dinámica de APIs para integración con IA
 */

router.use(apiRateLimiter);

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registrar una nueva API dinámicamente
 *     tags: [APIs]
 *     description: >
 *       Registra una nueva API en el sistema para su uso inmediato en consultas de IA.
 *       Las APIs registradas pueden ser detectadas automáticamente basándose en palabras clave.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/APIConfig'
 *           examples:
 *             sabiExample:
 *               summary: Ejemplo de API Sabi
 *               value:
 *                 id: "sabi"
 *                 name: "Sistema de Activos"
 *                 baseUrl: "https://sabi-api.example.com"
 *                 description: "Sistema de gestión de activos empresariales"
 *                 type: "assets"
 *                 active: true
 *                 keywords: ["usuario", "activo", "asset", "sabi"]
 *                 synonyms: ["inventario", "patrimonio", "bienes"]
 *                 endpoints:
 *                   - path: "/usuarios"
 *                     description: "Obtiene lista de usuarios del sistema"
 *                     method: "GET"
 *                     responseFormatter: "list"
 *                 healthEndpoint: "/health"
 *     responses:
 *       201:
 *         description: API registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 message: "API registrada exitosamente"
 *                 apiId: "sabi"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post('/register', validateAPIRegistration, asyncHandler(apiController.registerAPI));

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Obtener todas las APIs registradas
 *     tags: [APIs]
 *     description: Retorna la lista completa de APIs registradas en el sistema
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/PageParam'
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *     responses:
 *       200:
 *         description: Lista de APIs obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "sabi"
 *                   name: "Sistema de Activos"
 *                   baseUrl: "https://sabi-api.example.com"
 *                   description: "Sistema de gestión de activos empresariales"
 *                   type: "assets"
 *                   active: true
 *                 - id: "trendvoto"
 *                   name: "Sistema Electoral"
 *                   baseUrl: "https://trendvoto-api.example.com"
 *                   description: "Sistema de gestión electoral"
 *                   type: "voting"
 *                   active: true
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/', asyncHandler(apiController.getAPIs));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Obtener estado de salud de todas las APIs
 *     tags: [APIs]
 *     description: Retorna el estado de salud actual de todas las APIs registradas
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Estado de salud obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "sabi"
 *                   status: "healthy"
 *                   responseTime: 150
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                 - id: "trendvoto"
 *                   status: "unhealthy"
 *                   error: "Connection refused"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/health', asyncHandler(apiController.getAllAPIHealth));

/**
 * @swagger
 * /api/health/{apiId}:
 *   get:
 *     summary: Obtener estado de salud de una API específica
 *     tags: [APIs]
 *     description: Retorna el estado de salud detallado de una API específica
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiIdParam'
 *     responses:
 *       200:
 *         description: Estado de salud obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: "sabi"
 *                 status: "healthy"
 *                 responseTime: 150
 *                 successRate: 98.5
 *                 totalRequests: 1000
 *                 failedRequests: 15
 *                 timestamp: "2024-01-15T10:30:00.000Z"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/health/:apiId', asyncHandler(apiController.getAPIHealth));

export default router;