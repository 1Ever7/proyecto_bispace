// src/mcp/utils/Validation.ts
export function isValidJsonRpcMessage(message: any): boolean {
  if (typeof message !== 'object' || message === null) {
    return false;
  }
  
  if (message.jsonrpc !== '2.0') {
    return false;
  }
  
  if (message.id !== undefined && typeof message.id !== 'string' && typeof message.id !== 'number' && message.id !== null) {
    return false;
  }
  
  if (message.method !== undefined && typeof message.method !== 'string') {
    return false;
  }
  
  if (message.params !== undefined && (typeof message.params !== 'object' && !Array.isArray(message.params))) {
    return false;
  }
  
  if (message.result !== undefined && message.error !== undefined) {
    return false;
  }
  
  if (message.error !== undefined) {
    if (typeof message.error !== 'object' || message.error === null) {
      return false;
    }
    if (typeof message.error.code !== 'number') {
      return false;
    }
    if (typeof message.error.message !== 'string') {
      return false;
    }
  }
  
  return true;
}

export function sanitizeJsonOutput(obj: any): any {
  // Eliminar propiedades undefined y funciones
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value === undefined) {
      return null;
    }
    if (typeof value === 'function') {
      return undefined;
    }
    return value;
  }));
}