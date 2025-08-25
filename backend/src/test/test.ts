import { testSabiConnection } from '../utils/swaggerGenerator';
import { logger } from '../utils/logger';

const { spawn } = require('child_process');
const path = require('path');

async function runAllTests() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  logger.info('🚀 Ejecutando pruebas de conectividad...\n');
  try {
    await testSabiConnection();
    logger.info('\n' + '='.repeat(50) + '\n');
    // Puedes agregar más tests aquí si lo deseas

    logger.info('🧪 Probando servidor MCP...\n');
    await runMcpTests();

    logger.info('✅ Todas las pruebas completadas');
  } catch (error) {
    logger.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

function runMcpTests(): Promise<void> {
  return new Promise((resolve) => {
    const testCommands = [
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
      JSON.stringify({ jsonrpc: "2.0", id: 2, method: "resources/list", params: {} }),
      JSON.stringify({
        jsonrpc: "2.0", id: 3, method: "tools/call",
        params: { name: "query_api", arguments: { question: "¿Qué APIs están disponibles?" } }
      }),
      JSON.stringify({
        jsonrpc: "2.0", id: 4, method: "tools/call",
        params: { name: "get_api_info", arguments: { api_name: "sabi" } }
      })
    ];

    const tsNodePath = path.resolve(__dirname, '../../../node_modules/.bin/ts-node');
    const mcpServerPath = path.resolve(__dirname, '../mcp/mcpServer.ts');

    const child = spawn(tsNodePath, [mcpServerPath], {
      env: { ...process.env, SABI_BASE_URL: "https://sabi.bispace.site/api/usr", NODE_ENV: "test" },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data: unknown) => {
      if (data instanceof Buffer) {
        logger.info('📤 Respuesta MCP:', data.toString());
      }
    });

    child.stderr.on('data', (data: unknown) => {
      if (data instanceof Buffer) {
        logger.error('❌ Error MCP:', data.toString());
      }
    });

    child.on('close', (code: number | null) => {
      logger.info(`Proceso MCP finalizado con código: ${code}`);
      resolve();
    });

    // Enviar comandos de prueba
    setTimeout(() => {
      testCommands.forEach((cmd, index) => {
        setTimeout(() => {
          child.stdin.write(cmd + '\n');
        }, index * 1000);
      });
    }, 2000);

    // Terminar después de 10 segundos
    setTimeout(() => {
      child.kill();
    }, 10000);
  });
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllTests();
}