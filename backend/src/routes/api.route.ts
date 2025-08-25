import { Router } from 'express';
import { apiController } from '../controllers/api.controller';
// Asegúrate de importar este controlador

const router = Router();

/**
 * @swagger
 * /api/apis:
 *   get:
 *     summary: Listar todas las APIs disponibles
 *     responses:
 *       200:
 *         description: Lista de APIs configuradas
 */
router.get('/apis', apiController.listAPIs);
/**
 * @swagger
 * /api/query:
 *   get:
 *     summary: Consultar endpoint de API
 *     parameters:
 *       - in: query
 *         name: endpoint
 *         required: true
 *         description: Endpoint a consultar (ej: /usr, /activo)
 *       - in: query
 *         name: [param]
 *         description: Parámetros adicionales para el endpoint
 *     responses:
 *       200:
 *         description: Respuesta de la API
 */
router.get('/query', apiController.queryEndpoint);

/**
 * @swagger
 * /api/count:
 *   get:
 *     summary: Contar entidades en el sistema
 *     parameters:
 *       - in: query
 *         name: entity
 *         required: true
 *         description: Tipo de entidad (usuarios, activos, etc.)
 *     responses:
 *       200:
 *         description: Conteo de entidades
 */
router.get('/count', apiController.countEntities);

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Obtener documentación de APIs
 *     parameters:
 *       - in: query
 *         name: format
 *         description: Formato de documentación (markdown, swagger)
 *     responses:
 *       200:
 *         description: Documentación generada
 */
router.get('/docs', apiController.getDocumentation);

/**
 * @swagger
 * /api/endpoints:
 *   get:
 *     summary: Listar endpoints disponibles
 *     responses:
 *       200:
 *         description: Lista de endpoints
 */
router.get('/endpoints', apiController.listEndpoints);

router.get('/api-ids', apiController.listAPIIds);


export default router;