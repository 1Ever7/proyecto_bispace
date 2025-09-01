#!/usr/mcp-client-example tsx
import { McpClient } from './McpClient';
import { logger } from '../../utils/logger';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function printHeader(text: string): void {
  console.log(`\n${colors.bright}${colors.blue}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}🚀 ${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'═'.repeat(60)}${colors.reset}\n`);
}

function printSection(text: string): void {
  console.log(`\n${colors.bright}${colors.green}${'─'.repeat(40)}${colors.reset}`);
  console.log(`${colors.bright}${colors.green}📋 ${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${'─'.repeat(40)}${colors.reset}`);
}

function printSuccess(text: string): void {
  console.log(`${colors.green}✅ ${text}${colors.reset}`);
}

function printError(text: string): void {
  console.log(`${colors.red}❌ ${text}${colors.reset}`);
}

function printData(label: string, data: any): void {
  console.log(`\n${colors.bright}${colors.cyan}${label}:${colors.reset}`);
  console.log(JSON.stringify(data, null, 2));
}

async function runMcpExample(): Promise<void> {
  printHeader('CLIENTE MCP - EJEMPLO DE USO');

  // Crear cliente MCP
  const client = new McpClient('ws://localhost:3003/mcp');

  try {
    // 1️⃣ Conexión
    printSection('Conectando al servidor MCP');
    await client.connect();
    printSuccess('Conectado al servidor MCP');

    // 2️⃣ Inicialización
    printSection('Inicializando conexión');
    const initResult = await client.initialize();
    printData('Resultado de inicialización', initResult);
    printSuccess('Conexión inicializada');

    // 3️⃣ Ping
    printSection('Probando conexión con ping');
    const pong = await client.ping();
    printSuccess(`Ping exitoso: ${pong}`);

    // 4️⃣ Listar herramientas
    printSection('Herramientas disponibles');
    const tools = await client.listTools();
    printData('Herramientas MCP', tools);
    printSuccess(`Encontradas ${tools.tools?.length || 0} herramientas`);

    // 5️⃣ Listar recursos
    printSection('Recursos disponibles');
    const resources = await client.listResources();
    printData('Recursos MCP', resources);
    printSuccess(`Encontrados ${resources.resources?.length || 0} recursos`);

    // 6️⃣ 🔍 Prueba de búsqueda en bases de datos
    printSection('Búsqueda en bases de datos');
    try {
      // Aquí usamos callTool en lugar de handleCallTool
      const searchResult = await client.callTool('database_search', { 
        searchTerm: 'ever',
        limit: 5,
        includeCount: true
      });
      printData('Resultado búsqueda', searchResult);
      printSuccess('Búsqueda en bases completada');
    } catch (error) {
      printError(`Error buscando en bases de datos: ${error}`);
    }

    // 7️⃣ Descubrir APIs
    printSection('Descubriendo APIs');
    try {
      const discovery = await client.discoverApis('usuario', undefined, 5);
      printData('APIs descubiertas', discovery);
      printSuccess(`Encontradas ${discovery.count} APIs de ${discovery.total}`);
    } catch (discoveryError) {
      printError(`Error en descubrimiento: ${discoveryError}`);
    }

    // 8️⃣ Leer recursos del sistema
    printSection('Leyendo recursos del sistema');
    try {
      const systemInfo = await client.readSystemResource('info');
      printData('Información del sistema', systemInfo);
      printSuccess('Recurso del sistema leído');

      const memoryInfo = await client.readSystemResource('memory');
      printData('Información de memoria', memoryInfo);
      printSuccess('Información de memoria obtenida');
    } catch (systemError) {
      printError(`Error leyendo recursos del sistema: ${systemError}`);
    }

    // 9️⃣ Estado de conexión
    printSection('Estado de la conexión');
    const status = client.getConnectionStatus();
    const reconnectInfo = client.getReconnectInfo();
    console.log(`${colors.cyan}📊 Estado de conexión: ${colors.bright}${status}${colors.reset}`);
    console.log(`${colors.cyan}🔄 Intentos de reconexión: ${reconnectInfo.attempts}/${reconnectInfo.maxAttempts}${colors.reset}`);
    printSuccess('✅ Ejemplo completado exitosamente');

  } catch (error) {
    printError(`Error en ejemplo MCP: ${error}`);
    console.error('Stack trace:', error);
  } finally {
    // Desconectar
    printSection('Finalizando conexión');
    client.disconnect();
    printSuccess('Cliente desconectado');
  }
}

// 🎯 Ejecutar ejemplo
if (require.main === module) {
  runMcpExample().catch(error => {
    printError(`Error no manejado: ${error.message}`);
    process.exit(1);
  });
}

export { runMcpExample };
