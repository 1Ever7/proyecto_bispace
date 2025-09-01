// src/mcp/utils/Logger.ts
export class Logger {
  private logToStderr(level: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg);
      }
      return arg;
    }).join(' ');
    
    process.stderr.write(`[${timestamp}] [${level}] ${message}\n`);
  }

  debug(...args: any[]): void {
    this.logToStderr('DEBUG', ...args);
  }

  info(...args: any[]): void {
    this.logToStderr('INFO', ...args);
  }

  error(...args: any[]): void {
    this.logToStderr('ERROR', ...args);
  }

  warn(...args: any[]): void {
    this.logToStderr('WARN', ...args);
  }
}