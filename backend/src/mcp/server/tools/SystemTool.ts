// src/mcp/server/tools/SystemTool.ts
import { Logger } from '../../utils/Logger';
import { sanitizeJsonOutput } from '../../utils/Validation';

export class SystemTool {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  async execute(args: any): Promise<any> {
    try {
      this.logger.debug('Ejecutando SystemTool con args:', args);
      
      // Lógica de la herramienta - asegurar salida JSON válida
      const result = await this.getSystemInfo();
      
      return sanitizeJsonOutput({
        success: true,
        data: result
      });
    } catch (error) {
      this.logger.error('Error en SystemTool:', error);
      return sanitizeJsonOutput({
        success: false,
        error: error
      });
    }
  }

  private async getSystemInfo(): Promise<any> {
    // Asegurar que todas las propiedades estén entre comillas
    return {
      "appVersion": "1.0.0",
      "isPackaged": true,
      "platform": process.platform,
      "arch": process.arch,
      "nodeVersion": process.version,
      "versions": process.versions
    };
  }
}