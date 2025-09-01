// src/mcp/transport/HttpTransport.ts
import express, { Request, Response } from 'express';
import { McpServer } from '../server/McpServer';
import { McpMessage } from '../server/types/mcp.types';
import bodyParser from 'body-parser';
import { logger } from '../../utils/logger';

export class HttpTransport {
  private app = express();
  private server: any;
  constructor(private mcpServer: McpServer) {
    this.app.use(bodyParser.json());

    this.app.post('/mcp', async (req: Request, res: Response) => {
      const message: McpMessage = req.body;
     // logger.info('HTTPTransport received:', message);

      try {
        const response = await this.mcpServer['handleRequest'](message);
        res.json({
          jsonrpc: '2.0',
          id: message.id,
          ...response
        });
      } catch (error: any) {
        res.json({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32000,
            message: error.message
          }
        });
      }
    });
  }

  start(port: number = 3002): void {
    this.app.listen(port, () => {
      //logger.info(`🚀 HTTPTransport escuchando en http://localhost:${port}/mcp`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        console.error('HTTP Transport detenido');
      });
    }
  }
}
