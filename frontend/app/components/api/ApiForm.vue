<template>
  <div class="api-form">
    <h3>{{ editingApi ? 'Editar API' : 'Registrar Nueva API' }}</h3>
    
    <form @submit.prevent="handleSubmit">
      <AppInput
        label="ID de la API *"
        v-model="formData.id"
        placeholder="sabi"
        :disabled="!!editingApi"
        required
      />
      
      <AppInput
        label="Nombre *"
        v-model="formData.name"
        placeholder="Sistema de Activos"
        required
      />
      
      <AppInput
        label="URL Base *"
        v-model="formData.baseUrl"
        type="url"
        placeholder="https://sabi-api.example.com"
        required
      />
      
      <div class="form-group">
        <label>Descripción *</label>
        <textarea
          v-model="formData.description"
          placeholder="Sistema de gestión de activos empresariales"
          required
        ></textarea>
      </div>
      
      <AppInput
        label="Tipo"
        v-model="formData.type"
        placeholder="assets"
      />
      
      <div class="form-group">
        <label>Palabras Clave (separadas por comas)</label>
        <input
          v-model="keywordsInput"
          type="text"
          placeholder="usuario, activo, asset, sabi"
        />
      </div>
      
      <div class="form-group">
        <label>Sinónimos (separados por comas)</label>
        <input
          v-model="synonymsInput"
          type="text"
          placeholder="inventario, patrimonio, bienes"
        />
      </div>
      
      <AppInput
        label="Endpoint de Salud"
        v-model="formData.healthEndpoint"
        placeholder="/health"
      />
      
      <h4>Endpoints</h4>
      <div
        v-for="(endpoint, index) in formData.endpoints"
        :key="index"
        class="endpoint"
      >
        <AppInput
          label="Path del Endpoint *"
          v-model="endpoint.path"
          placeholder="/usuarios"
          required
        />
        
        <AppInput
          label="Descripción *"
          v-model="endpoint.description"
          placeholder="Obtiene lista de usuarios del sistema"
          required
        />
        
        <div class="form-group">
          <label>Método HTTP *</label>
          <select v-model="endpoint.method" required>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
        
        <AppButton
          type="button"
          variant="danger"
          size="small"
          @click="removeEndpoint(index)"
        >
          Eliminar Endpoint
        </AppButton>
      </div>
      
      <AppButton
        type="button"
        variant="secondary"
        size="small"
        @click="addEndpoint"
      >
        Agregar Endpoint
      </AppButton>
      
      <div class="form-actions">
        <AppButton
          type="submit"
          :loading="loading"
        >
          {{ editingApi ? 'Actualizar' : 'Registrar' }}
        </AppButton>
        <AppButton
          type="button"
          variant="secondary"
          @click="$emit('cancel')"
          v-if="editingApi"
        >
          Cancelar
        </AppButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { APIConfig, APIEndpointConfig } from '~/types/api';

const props = defineProps<{
  editingApi?: APIConfig | null;
}>();

const emit = defineEmits(['submit', 'cancel']);

const formData = reactive<APIConfig>({
  id: '',
  name: '',
  baseUrl: '',
  description: '',
  type: '',
  active: true,
  keywords: [],
  synonyms: [],
  endpoints: [],
  healthEndpoint: ''
});

const keywordsInput = ref('');
const synonymsInput = ref('');
const loading = ref(false);

// Initialize with editing data if exists
watch(() => props.editingApi, (api) => {
  if (api) {
    Object.assign(formData, { ...api });
    keywordsInput.value = api.keywords.join(', ');
    synonymsInput.value = api.synonyms.join(', ');
  }
}, { immediate: true });

// Convert text inputs to arrays
watch([keywordsInput, synonymsInput], () => {
  formData.keywords = keywordsInput.value
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);
  
  formData.synonyms = synonymsInput.value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
});

const addEndpoint = () => {
  formData.endpoints.push({
    path: '',
    description: '',
    method: 'GET'
  });
};

const removeEndpoint = (index: number) => {
  formData.endpoints.splice(index, 1);
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    emit('submit', { ...formData });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.api-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group textarea,
.form-group select,
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.endpoint {
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>