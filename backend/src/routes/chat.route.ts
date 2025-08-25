// chat.routes.ts (corregido)
import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatRequest:
 *       type: object
 *       required:
 *         - question
 *       properties:
 *         question:
 *           type: string
 *           example: ¿Cómo crear un nuevo activo?
 *         model:
 *           type: string
 *           enum: [claude, gemini]
 *           default: claude
 *         targetAPI:
 *           type: string
 *           description: API específica a consultar (obsoleto, usar apiId)
 *           example: sabi
 *         apiId:
 *           type: string
 *           enum: [sabi, rh, nueva-api] // Actualizar con las APIs disponibles
 *           default: sabi
 *           description: ID de la API específica a consultar
 *           example: sabi
 *     ChatResponseData:
 *       type: object
 *       properties:
 *         answer:
 *           type: string
 *         context:
 *           type: string
 *         relevantAPIs:
 *           type: array
 *           items:
 *             type: string
 *         availableAPIs:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *         specifiedAPI:
 *           type: string
 *     ChatResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           $ref: '#/components/schemas/ChatResponseData'
 *         error:
 *           type: string
 *         message:
 *           type: string
 *         timestamp:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Endpoints para interactuar con modelos de IA
 */

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Responde preguntas sobre múltiples APIs
 *     description: |
 *       Permite hacer preguntas a la IA utilizando datos de APIs específicas.
 *       Puedes especificar una API concreta usando el parámetro apiId.
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *           examples:
 *             preguntaGeneral:
 *               summary: Pregunta general (detección automática)
 *               value:
 *                 question: "¿Cuántos activos tenemos?"
 *                 model: "claude"
 *             preguntaEspecifica:
 *               summary: Pregunta para API específica
 *               value:
 *                 question: "¿Cuántos usuarios activos hay?"
 *                 model: "claude"
 *                 apiId: "sabi"
 *     responses:
 *       200:
 *         description: Respuesta generada por IA
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: Parámetros inválidos
 *       429:
 *         description: Límite de tasa excedido
 *       500:
 *         description: Error interno del servidor
 */

router.get('/status', (req, res) => res.json({ message: 'Chat API funcionando' }));
router.post('/', chatController.handleApiQuestion);

/**
 * @swagger
 * /api/chat/summary:
 *   post:
 *     summary: Obtener resumen de todos los sistemas disponibles
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 enum: [claude, gemini]
 *                 default: claude
 *     responses:
 *       200:
 *         description: Resumen ejecutivo de sistemas
 */
router.post('/summary', chatController.getSystemsSummary);


export default router;