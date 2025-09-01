<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-content">
        <NuxtLink to="/" class="logo">
          <h1>Asistente API</h1>
        </NuxtLink>
        
        <nav class="main-nav">
          <NuxtLink to="/">Inicio</NuxtLink>
          <NuxtLink to="/chat">Chat</NuxtLink>
          <NuxtLink to="/apis">APIs</NuxtLink>
        </nav>
      </div>
    </header>
    
    <main class="app-main">
      <slot />
    </main>
    
    <footer class="app-footer">
      <div class="footer-content">
        <p>&copy; 2024 Asistente API - Sistema de gestión de APIs e IA</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  color: white;
}

.logo {
  text-decoration: none;
}

.main-nav {
  display: flex;
  gap: 2rem;
}

.main-nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
}

.main-nav a:hover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: white;
}

.main-nav a.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: white;
}

.app-main {
  flex: 1;
  padding: 2rem 0;
}

.app-footer {
  background: #34495e;
  color: white;
  padding: 1.5rem 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }
  
  .main-nav {
    gap: 1rem;
  }
  
  .app-main {
    padding: 1rem 0;
  }
  
  .footer-content {
    padding: 0 1rem;
  }
}
</style>