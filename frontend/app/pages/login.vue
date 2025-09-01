<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="login-header">
        <h1>Bienvenido a BotAPI</h1>
        <p>Inicia sesión para continuar en tu cuenta</p>
      </div>

      <div class="login-form">
        <div v-if="errorMessage" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <div class="form-group">
          <label for="username">Usuario</label>
          <div class="input-with-icon">
            <i class="fas fa-user"></i>
            <input 
              type="text" 
              id="username" 
              placeholder="Ingresa tu usuario" 
              v-model="username"
              @keyup.enter="handleLogin"
              :disabled="isLoading"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-with-icon">
            <i class="fas fa-lock"></i>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              placeholder="Ingresa tu contraseña" 
              v-model="password"
              @keyup.enter="handleLogin"
              :disabled="isLoading"
            />
            <span class="password-toggle" @click="togglePasswordVisibility">
              {{ showPassword ? '🙈' : '👁️' }}
            </span>
          </div>
        </div>

        <button class="btn-login" @click="handleLogin" :disabled="isLoading">
          <span v-if="!isLoading">Iniciar sesión</span>
          <span v-else>
            <i class="fas fa-spinner fa-spin"></i> Iniciando...
          </span>
        </button>

        <div class="additional-options">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe" :disabled="isLoading" />
            <span>Recordarme</span>
          </label>

          <a href="#" class="forgot-password" @click.prevent="handlePasswordRecovery">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <div class="signup-link">
          <p>¿No tienes cuenta? <a href="#" @click.prevent="showRegister">Regístrate</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiresGuest: true,
  layout: 'auth'
});

import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

// Configuración de API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOGIN || 'http://trendvoto.bispace.site/api/'

const { login } = useAuth()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const isClient = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  errorMessage.value = ''

  if (!username.value.trim() || !password.value) {
    errorMessage.value = 'Por favor ingresa usuario y contraseña'
    return
  }

  isLoading.value = true

  try {
    const success = await login(username.value, password.value)
    
    if (success) {
      // Guardar en localStorage si el usuario seleccionó "Recordarme" y estamos en el cliente
      if (isClient.value && rememberMe.value) {
        localStorage.setItem('rememberedUser', username.value)
      }
      
      // Redirigir a la página principal
      if (isClient.value) {
        window.location.href = '/dashboard'
      }
    } else {
      errorMessage.value = 'Usuario o contraseña incorrectos'
    }
  } catch (error: any) {
    console.error('Error en login:', error)
    
    if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
      errorMessage.value = 'Error de conexión. Verifica tu conexión a internet.'
    } else {
      errorMessage.value = 'Error al iniciar sesión. Intenta nuevamente.'
    }
  } finally {
    isLoading.value = false
  }
}

const handlePasswordRecovery = () => {
  if (!isClient.value) return
  const { isAuthenticated } = useAuth()

  const email = prompt('Ingresa tu correo electrónico para recuperar tu contraseña:')
  if (!email) return

  // Lógica para recuperación de contraseña
  fetch(`${API_BASE_URL}auth/recovery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message || 'Se ha enviado un enlace de recuperación a tu correo.')
  })
  .catch(err => {
    console.error('Error en recuperación:', err)
    alert('Error al enviar solicitud de recuperación.')
  })
}

const showRegister = () => {
  if (isClient.value) {
    // Navegar al componente de registro
    window.location.href = '/register'
  }else {
    navigateTo('/login')
  }
}

onMounted(() => {
  // Marcar que estamos en el cliente
  isClient.value = true
  
  // Cargar usuario recordado si existe
  try {
    const rememberedUser = localStorage.getItem('rememberedUser')
    if (rememberedUser) {
      username.value = rememberedUser
      rememberMe.value = true
    }
  } catch (error) {
    console.warn('No se pudo acceder a localStorage:', error)
  }
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
}

.login-header {
  background: linear-gradient(to right, #4b6cb7, #182848);
  color: white;
  padding: 25px;
  text-align: center;
}

.login-header h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.login-header p {
  opacity: 0.8;
}

.login-form {
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.input-with-icon {
  position: relative;
}

.input-with-icon i {
  position: absolute;
  left: 12px;
  top: 12px;
  color: #777;
  z-index: 1;
}

.input-with-icon input {
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 12px;
  cursor: pointer;
  color: #777;
  z-index: 1;
}

.input-with-icon input:focus {
  border-color: #4b6cb7;
  outline: none;
  box-shadow: 0 0 0 2px rgba(75, 108, 183, 0.2);
}

.btn-login {
  width: 100%;
  padding: 14px;
  background: linear-gradient(to right, #4b6cb7, #182848);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-message i {
  font-size: 18px;
}

.additional-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  font-size: 14px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 5px;
}

.forgot-password {
  color: #4b6cb7;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.signup-link {
  text-align: center;
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.signup-link a {
  color: #4b6cb7;
  text-decoration: none;
  font-weight: 500;
}

.signup-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-container {
    max-width: 100%;
  }

  .login-header {
    padding: 20px;
  }

  .login-form {
    padding: 20px;
  }
  
  .additional-options {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>