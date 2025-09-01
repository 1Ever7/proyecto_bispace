<template>
  <div class="app-layout">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <h1>Asistente API</h1>
        <nav class="main-nav">
          <NuxtLink 
            to="/" 
            :class="{ active: isActive('/dashboard') }"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink 
            to="/apis" 
            :class="{ active: isActive('/apis') }"
          >
            APIs
          </NuxtLink>
          <NuxtLink 
            to="/chat" 
            :class="{ active: isActive('/chat') }"
          >
            Chat
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- Main content -->
    <main class="app-main">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <p>&copy; 2024 Asistente API - Sistema de gestión de APIs e IA</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

// Para marcar la ruta activa en la barra de navegación
const route = useRoute()
const isActive = (path: string) => route.path === path
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6fa;
}

/* Header */
.app-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 1.5rem;
}

/* Navigation */
.main-nav {
  display: flex;
  gap: 20px;
}

.main-nav a {
  color: white;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.main-nav a:hover {
  background-color: rgba(255,255,255,0.1);
}

.main-nav a.active {
  background-color: #3498db;
}

/* Main content */
.app-main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Footer */
.app-footer {
  background: #34495e;
  color: white;
  text-align: center;
  padding: 1rem 0;
  margin-top: auto;
  font-size: 0.9rem;
}
</style>
