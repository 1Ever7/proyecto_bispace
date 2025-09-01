// src/mcp/middleware/OutputCleaner.ts
export class OutputCleaner {
  static setup(): void {
    // Redirigir console.log a stderr
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      process.stderr.write(`[CONSOLE] ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      ).join(' ')}\n`);
    };

    // Interceptar stdout para validar JSON
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = (chunk: any, encoding?: any, callback?: any): boolean => {
      if (typeof chunk === 'string') {
        try {
          JSON.parse(chunk);
          return originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
        } catch {
          // Redirigir no-JSON a stderr
          process.stderr.write(`NON-JSON OUTPUT: ${chunk}\n`);
          return true;
        }
      }
      return originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
    };
  }
}