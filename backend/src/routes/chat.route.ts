import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { validateChatRequest } from '../middleware/validation/apiValidation';
import { chatRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat inteligente con integración dinámica de APIs
 */

router.use(chatRateLimiter);

/**
 * @swagger
 * /api/chat/message:
 *   post:
 *     summary: Enviar mensaje al asistente de IA con integración de APIs
 *     tags: [Chat]
 *     description: >
 *       Procesa un mensaje utilizando modelos de IA (Gemini o Claude) con capacidad de
 *       detectar automáticamente APIs relevantes y consultarlas para obtener datos reales
 *       antes de generar una respuesta contextualizada.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *           examples:
 *             simpleMessage:
 *               summary: Mensaje simple con detección automática
 *               value:
 *                 message: "Lista los usuarios del sistema de activos"
 *                 model: "claude"
 *             specificAPI:
 *               summary: Mensaje con API específica
 *               value:
 *                 message: "Obtén los usuarios activos"
 *                 apiId: "sabi"
 *                 model: "gemini"
 *                 temperature: 0.7
 *             conversation:
 *               summary: Conversación con historial
 *               value:
 *                 messages:
 *                   - role: "user"
 *                     content: "Hola, necesito información del sistema"
 *                   - role: "assistant"
 *                     content: "¡Hola! ¿De qué sistema necesitas información?"
 *                   - role: "user"
 *                     content: "Del sistema de activos, quiero ver los usuarios"
 *                 model: "claude"
 *                 temperature: 0.5
 *     responses:
 *       200:
 *         description: Respuesta exitosa del asistente de IA
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *             example:
 *               success: true
 *               data:
 *                 response: "## Lista de Usuarios del Sistema Sabi\n\nDe acuerdo con los datos del sistema, hay 3 usuarios registrados:\n\n| ID | Nombre | Email | Departamento |\n|----|--------|-------|-------------|\n| 1 | Juan Pérez | juan@empresa.com | Ventas |\n| 2 | María García | maria@empresa.com | IT |\n| 3 | Carlos López | carlos@empresa.com | Recursos Humanos |\n\n*Total: 3 usuarios activos*"
 *                 processingTime: "1250ms"
 *                 usedModel: "claude"
 *                 apiData: "Datos de API: sabi"
 *                 relevantAPIs: ["sabi"]
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post('/message', validateChatRequest, asyncHandler(chatController.handleMessage));

export default router;