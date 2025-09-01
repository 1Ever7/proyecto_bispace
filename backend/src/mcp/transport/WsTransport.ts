import { Server } from 'http';
import WebSocket from 'ws';
import { logger } from '../../utils/logger';

export class WsTransport {
  private wss: WebSocket.Server;
  private messageHandler: ((message: any, ws: WebSocket) => void) | null = null;

  constructor(server: Server, path: string = '/mcp') {
    this.wss = new WebSocket.Server({ server, path });
    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      logger.info('Cliente MCP WebSocket conectado');

      // Configurar heartbeat para mantener la conexión activa
      let isAlive = true;
      const heartbeatInterval = setInterval(() => {
        if (!isAlive) {
          ws.terminate();
          clearInterval(heartbeatInterval);
          return;
        }
        isAlive = false;
        ws.ping();
      }, 30000);

      ws.on('pong', () => {
        isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          // Asegurarse de que los datos son una cadena válida
          const messageStr = data.toString();
          
          // Validar que es un JSON válido antes de parsear
          if (!this.isValidJson(messageStr)) {
            throw new Error('Invalid JSON format');
          }
          
          const message = JSON.parse(messageStr);
          logger.debug('Mensaje recibido:', message);

          if (this.messageHandler) {
            this.messageHandler(message, ws);
          }
        } catch (error) {
          logger.error('Error procesando mensaje WebSocket:', error, data.toString());
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32700,
              message: 'Parse error: Invalid JSON format'
            }
          }));
        }
      });

      ws.on('close', () => {
        logger.info('Cliente MCP WebSocket desconectado');
        clearInterval(heartbeatInterval);
      });

      ws.on('error', (error) => {
        logger.error('Error en WebSocket:', error);
        clearInterval(heartbeatInterval);
      });
    });

    this.wss.on('error', (error) => {
      logger.error('Error en servidor WebSocket:', error);
    });
  }

  private isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  onMessage(handler: (message: any, ws: WebSocket) => void): void {
    this.messageHandler = handler;
  }

  stop(): void {
    this.wss.close();
  }
}