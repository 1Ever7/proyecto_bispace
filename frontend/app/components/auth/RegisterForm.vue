<template>
  <AppCard title="Crear Cuenta">
    <form @submit.prevent="handleSubmit">
      <AppInput
        label="Nombre completo"
        type="text"
        v-model="form.name"
        placeholder="Tu nombre completo"
        :error="errors.name"
        required
      />
      
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
        placeholder="Crea una contraseña segura"
        :error="errors.password"
        required
      />
      
      <AppInput
        label="Confirmar contraseña"
        type="password"
        v-model="form.passwordConfirm"
        placeholder="Repite tu contraseña"
        :error="errors.passwordConfirm"
        required
      />
      
      <div class="form-actions">
        <AppButton
          type="submit"
          :loading="loading"
          :disabled="loading"
        >
          Crear Cuenta
        </AppButton>
        
        <p class="login-link">
          ¿Ya tienes cuenta? 
          <a href="#" @click.prevent="$emit('show-login')">Inicia sesión aquí</a>
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

const emit = defineEmits(['success', 'show-login']);

const { register, loading, error } = useAuth();

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: ''
});

const errors = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: ''
});

const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.name = '';
  errors.email = '';
  errors.password = '';
  errors.passwordConfirm = '';
  
  // Validate name
  if (!form.name) {
    errors.name = 'El nombre es requerido';
    isValid = false;
  }
  
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
  
  // Validate password confirmation
  if (!form.passwordConfirm) {
    errors.passwordConfirm = 'Debes confirmar tu contraseña';
    isValid = false;
  } else if (form.password !== form.passwordConfirm) {
    errors.passwordConfirm = 'Las contraseñas no coinciden';
    isValid = false;
  }
  
  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  try {
    await register(form);
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

.login-link {
  text-align: center;
  margin: 0;
}

.login-link a {
  color: #007bff;
  text-decoration: none;
}

.login-link a:hover {
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