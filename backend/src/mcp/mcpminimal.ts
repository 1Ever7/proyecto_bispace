import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "api-assistant",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

async function run() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("✅ MCP Server corriendo...");
  } catch (err) {
    console.error("❌ Error al iniciar MCP:", err);
    process.exit(1);
  }
}

run();
