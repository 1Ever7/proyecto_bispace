// scripts/generate-docs.ts (actualizado)
import { APIManager } from '../services/api/apiManager';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

async function generateDocumentation() {
  try {
    logger.info('Iniciando generación de documentación...');
    
    const apiManager = new APIManager();
    
    // Define docs directory
    const docsDir = path.join(__dirname, '../../docs');
    
    // Create docs directory if it doesn't exist
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Generar documentación para cada API
    const apis = await apiManager.getAllAPIs();
    
    for (const api of apis) {
      try {
        logger.info(`Generando documentación para ${api.id}...`);
        
        // Generar OpenAPI
        const openAPIDoc = await apiManager.getAPIDocumentation(api.id, 'openapi');
        const yaml = require('yaml');
        const yamlString = yaml.stringify(openAPIDoc);
        
        // Crear directorios si no existen
        const docsDir = path.join(__dirname, '../../docs');
        const apiDocsDir = path.join(docsDir, api.id);
        if (!fs.existsSync(apiDocsDir)) {
          fs.mkdirSync(apiDocsDir, { recursive: true });
        }
        
        // Guardar documentación
        await Promise.all([
          fs.promises.writeFile(
            path.join(apiDocsDir, 'openapi.yaml'), 
            yamlString, 
            'utf8'
          ),
          fs.promises.writeFile(
            path.join(apiDocsDir, 'openapi.json'), 
            JSON.stringify(openAPIDoc, null, 2), 
            'utf8'
          )
        ]);
        
        // Generar Markdown
        const markdownDocs = await apiManager.getAPIDocumentation(api.id, 'markdown');
        await fs.promises.writeFile(
          path.join(apiDocsDir, 'documentation.md'), 
          markdownDocs, 
          'utf8'
        );
        
        logger.info(`✅ Documentación generada para ${api.id}`);
      } catch (error) {
        logger.error(`❌ Error generando documentación para ${api.id}:`, error);
      }
    }
    
    // Generar documentación consolidada
    logger.info('Generando documentación consolidada...');
    const consolidatedOpenAPI = await apiManager.getConsolidatedDocumentation('openapi');
    const consolidatedMarkdown = await apiManager.getConsolidatedDocumentation('markdown');
    
    await Promise.all([
      fs.promises.writeFile(
        path.join(docsDir, 'consolidated-openapi.json'), 
        JSON.stringify(consolidatedOpenAPI, null, 2), 
        'utf8'
      ),
      fs.promises.writeFile(
        path.join(docsDir, 'consolidated-documentation.md'), 
        consolidatedMarkdown, 
        'utf8'
      )
    ]);
    
    logger.info('✅ Documentación consolidada generada');
    logger.info('📁 Archivos creados en la carpeta /docs');
    
  } catch (error) {
    logger.error('❌ Error generando documentación:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  generateDocumentation();
}