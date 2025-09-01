// src/config/env-setup.ts
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
const envPath = path.resolve(__dirname, '../../.env');
console.log('📁 Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env:', result.error);
  process.exit(1);
}

console.log('🔍 Variables de entorno cargadas:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `✅ (${process.env.GEMINI_API_KEY.length} caracteres)` : '❌ NO ENCONTRADA');
console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '✅ PRESENTE' : '❌ NO ENCONTRADA');

// Validar que al menos una API key está presente
if (!process.env.CLAUDE_API_KEY && !process.env.GEMINI_API_KEY) {
  console.error('🚨 CRITICAL: No API keys found!');
  process.exit(1);
}

export const envLoaded = true;