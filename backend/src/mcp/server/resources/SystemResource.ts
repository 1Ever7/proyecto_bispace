import { Logger } from '../../utils/Logger';
import { sanitizeJsonOutput } from '../../utils/Validation';
import os from 'os';

export class SystemResource {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  getResourceInfo() {
    return {
      uri: "system://info",
      name: "System Information",
      description: "Información general del sistema (versión, plataforma, Node, etc.)",
      mimeType: "application/json"
    };
  }

  async read(uri: string): Promise<any> {
    try {
      this.logger.debug('Leyendo recurso:', uri);
      
      const resource = uri.replace('system://', '');
      let data: any;

      switch (resource) {
        case 'info':
          data = this.getSystemInfo();
          break;
        case 'memory':
          data = this.getMemoryInfo();
          break;
        case 'cpu':
          data = this.getCpuInfo();
          break;
        case 'uptime':
          data = this.getUptimeInfo();
          break;
        default:
          throw new Error(`Recurso no encontrado: ${resource}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(sanitizeJsonOutput(data), null, 2)
          }
        ]
      };
    } catch (error) {
      this.logger.error('Error leyendo recurso:', error);
      throw error;
    }
  }

  private getSystemInfo(): any {
    return {
      appVersion: "1.0.0",
      isPackaged: true,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      versions: process.versions
    };
  }

  private getMemoryInfo(): any {
    const mem = process.memoryUsage();
    return {
      totalMemory: mem.heapTotal,
      usedMemory: mem.heapUsed,
      externalMemory: mem.external,
      arrayBuffers: mem.arrayBuffers
    };
  }

  private getCpuInfo(): any {
    return {
      cores: os.cpus().length,
      model: os.cpus()[0].model,
      speedMHz: os.cpus()[0].speed,
      loadavg: os.loadavg()
    };
  }

  private getUptimeInfo(): any {
    return {
      uptimeSeconds: process.uptime(),
      uptimeMinutes: Math.floor(process.uptime() / 60)
    };
  }
}
