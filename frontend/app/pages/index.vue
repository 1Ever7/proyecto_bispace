<template>
  <div class="home-page">
    <header class="hero-section">
      <h1>Asistente API</h1>
      <p>Sistema inteligente de gestión de APIs con integración de IA</p>
      <div class="hero-actions">
        <NuxtLink to="/chat">
          <AppButton size="large">Comenzar a Chatear</AppButton>
        </NuxtLink>
        <NuxtLink to="/apis">
          <AppButton variant="secondary" size="large">Gestionar APIs</AppButton>
        </NuxtLink>
      </div>
    </header>
    
    <section class="features-section">
      <h2>Características Principales</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <h3>Asistente IA</h3>
          <p>Conversa con modelos de IA avanzados (Claude y Gemini) que pueden acceder a tus APIs registradas.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔌</div>
          <h3>Gestión de APIs</h3>
          <p>Registra y gestiona múltiples APIs con detección automática basada en palabras clave.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>Monitoreo de Salud</h3>
          <p>Verifica el estado de salud de todas tus APIs en tiempo real con métricas detalladas.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Integración Inteligente</h3>
          <p>El sistema detecta automáticamente qué API usar según el contexto de la conversación.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">

useHead({
  title: 'Asistente API - Inicio'
});
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero-section {
  text-align: center;
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 3rem;
}

.hero-section h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero-section p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.features-section {
  margin-bottom: 3rem;
}

.features-section h2 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .home-page {
    padding: 1rem;
  }
  
  .hero-section {
    padding: 2rem 1rem;
  }
  
  .hero-section h1 {
    font-size: 2rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>