<template>
  <AppCard title="Iniciar Sesión">
    <form @submit.prevent="handleSubmit">
      <AppInput
        label="Email"
        type="email"
        v-model="form.email"
        placeholder="tu@email.com"
        :error="errors.email"
        required
      />
      
      <AppInput
        label="Contraseña"
        type="password"
        v-model="form.password"
        placeholder="Tu contraseña"
        :error="errors.password"
        required
      />
      
      <div class="form-actions">
        <AppButton
          type="submit"
          :loading="loading"
          :disabled="loading"
        >
          Iniciar Sesión
        </AppButton>
        
        <p class="register-link">
          ¿No tienes cuenta? 
          <a href="#" @click.prevent="$emit('show-register')">Regístrate aquí</a>
        </p>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </form>
  </AppCard>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useAuth } from '~/composables/useAuth';

const emit = defineEmits(['success', 'show-register']);

const { login, loading, error } = useAuth();

const form = reactive({
  email: '',
  password: ''
});

const errors = reactive({
  email: '',
  password: ''
});

const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.email = '';
  errors.password = '';
  
  // Validate email
  if (!form.email) {
    errors.email = 'El email es requerido';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'El formato del email no es válido';
    isValid = false;
  }
  
  // Validate password
  if (!form.password) {
    errors.password = 'La contraseña es requerida';
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
    isValid = false;
  }
  
  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  try {
    await login(form);
    emit('success');
  } catch (err) {
    // El error ya está manejado por el composable
  }
};
</script>

<style scoped>
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.register-link {
  text-align: center;
  margin: 0;
}

.register-link a {
  color: #007bff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
}
</style>