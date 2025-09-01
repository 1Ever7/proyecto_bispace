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

        <div class="header-actions">
          <div v-if="isAuthenticated" class="user-menu">
            <button class="user-button" @click="toggleUserMenu">
              <span class="user-avatar">
                {{ userInitials }}
              </span>
              <span class="user-name">{{ user?.name }}</span>
              <span class="dropdown-arrow">▼</span>
            </button>
            
            <div v-if="showUserMenu" class="user-dropdown">
              <button @click="handleProfile" class="dropdown-item">
                <span>👤</span> Mi Perfil
              </button>
              <button @click="handleSettings" class="dropdown-item">
                <span>⚙️</span> Configuración
              </button>
              <div class="dropdown-divider"></div>
              <button @click="handleLogout" class="dropdown-item">
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          </div>
          
          <div v-else class="auth-buttons">
            <NuxtLink to="/login" class="login-button">Iniciar Sesión</NuxtLink>
            <NuxtLink to="/login" class="register-button">Registrarse</NuxtLink>
          </div>
        </div>
      </div>
    </header>
    
    <main class="app-main">
      <div class="main-content">
        <slot />
      </div>
    </main>
    
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Asistente API</h3>
          <p>Sistema inteligente de gestión de APIs con integración de IA</p>
        </div>
        
        <div class="footer-section">
          <h4>Enlaces Rápidos</h4>
          <ul>
            <li><NuxtLink to="/">Inicio</NuxtLink></li>
            <li><NuxtLink to="/chat">Chat</NuxtLink></li>
            <li><NuxtLink to="/apis">APIs</NuxtLink></li>
            <li><NuxtLink to="/documentation">Documentación</NuxtLink></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Soporte</h4>
          <ul>
            <li><a href="#">Centro de Ayuda</a></li>
            <li><a href="#">Contacto</a></li>
            <li><a href="#">Política de Privacidad</a></li>
            <li><a href="#">Términos de Servicio</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Conecta</h4>
          <div class="social-links">
            <a href="#" class="social-link">📘</a>
            <a href="#" class="social-link">🐦</a>
            <a href="#" class="social-link">💼</a>
            <a href="#" class="social-link">📷</a>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2024 Asistente API - Sistema de gestión de APIs e IA. Todos los derechos reservados.</p>
      </div>
    </footer>

    <!-- Overlay para cerrar menús al hacer clic fuera -->
    <div 
      v-if="showUserMenu" 
      class="overlay" 
      @click="showUserMenu = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth';

const { user, isAuthenticated, logout } = useAuth();
const showUserMenu = ref(false);

const userInitials = computed(() => {
  if (!user.value?.name) return 'U';
  return user.value.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const handleProfile = () => {
  showUserMenu.value = false;
  // Navegar al perfil del usuario
  console.log('Navegar al perfil');
};

const handleSettings = () => {
  showUserMenu.value = false;
  // Navegar a configuración
  console.log('Navegar a configuración');
};

const handleLogout = async () => {
  showUserMenu.value = false;
  await logout();
  // Redirigir al login
  await navigateTo('/login');
};

// Cerrar menú al presionar Escape
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showUserMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
});
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.app-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  color: white;
  font-weight: 700;
}

.logo {
  text-decoration: none;
}

.main-nav {
  display: flex;
  gap: 2rem;
  flex: 1;
  justify-content: center;
}

.main-nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.2s ease;
}

.main-nav a:hover {
  color: #3498db;
}

.main-nav a:hover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #3498db;
  transform: scaleX(1);
  transition: transform 0.2s ease;
}

.main-nav a.router-link-active {
  color: #3498db;
}

.main-nav a.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #3498db;
}

.header-actions {
  display: flex;
  align-items: center;
}

.auth-buttons {
  display: flex;
  gap: 1rem;
}

.login-button,
.register-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.login-button {
  color: white;
  border: 1px solid white;
}

.login-button:hover {
  background: white;
  color: #2c3e50;
}

.register-button {
  background: #3498db;
  color: white;
  border: 1px solid #3498db;
}

.register-button:hover {
  background: #2980b9;
  border-color: #2980b9;
}

.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.user-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-name {
  font-weight: 500;
}

.dropdown-arrow {
  font-size: 0.75rem;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 101;
  margin-top: 0.5rem;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
  color: #2c3e50;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-divider {
  height: 1px;
  background: #e9ecef;
  margin: 0.25rem 0;
}

.app-main {
  flex: 1;
  padding: 2rem 0;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.app-footer {
  background: #34495e;
  color: white;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer-section h3,
.footer-section h4 {
  margin-bottom: 1rem;
  color: #ecf0f1;
}

.footer-section h3 {
  font-size: 1.5rem;
}

.footer-section p {
  line-height: 1.6;
  color: #bdc3c7;
}

.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #bdc3c7;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-section a:hover {
  color: #3498db;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  display: inline-block;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 1.2rem;
}

.social-link:hover {
  background: #3498db;
  transform: translateY(-2px);
}

.footer-bottom {
  border-top: 1px solid #2c3e50;
  padding: 1.5rem 2rem;
  text-align: center;
}

.footer-bottom p {
  margin: 0;
  color: #bdc3c7;
  font-size: 0.875rem;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 99;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }
  
  .main-nav {
    order: 3;
    width: 100%;
    justify-content: space-around;
    gap: 0;
  }
  
  .main-nav a {
    padding: 0.5rem;
    font-size: 0.9rem;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 2rem 1rem;
  }
  
  .social-links {
    justify-content: center;
  }
  
  .user-name {
    display: none;
  }
  
  .app-main {
    padding: 1rem 0;
  }
  
  .main-content {
    padding: 0 1rem;
  }
}

@media (max-width: 480px) {
  .auth-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .login-button,
  .register-button {
    text-align: center;
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
</style>