<template>
  <div class="apis-page">
    <div class="page-header">
      <h1>Gestión de APIs</h1>
      <p>Registra y gestiona las APIs que el asistente de IA puede utilizar</p>
    </div>
    
    <div class="api-management">
      <div class="api-form-section">
        <h2>{{ editingApi ? 'Editar API' : 'Registrar Nueva API' }}</h2>
        <ApiForm
          :editing-api="editingApi"
          @submit="handleApiSubmit"
          @cancel="editingApi = null"
        />
      </div>
      
      <div class="api-list-section">
        <h2>APIs Registradas</h2>
        <ApiHealthStatus />
        
        <div class="api-list">
          <div
            v-for="api in apis"
            :key="api.id"
            class="api-card"
          >
            <div class="api-info">
              <h3>{{ api.name }}</h3>
              <p class="api-id">{{ api.id }}</p>
              <p class="api-description">{{ api.description }}</p>
              <p class="api-url">{{ api.baseUrl }}</p>
              
              <div class="api-keywords">
                <span
                  v-for="keyword in api.keywords"
                  :key="keyword"
                  class="keyword-tag"
                >
                  {{ keyword }}
                </span>
              </div>
            </div>
            
            <div class="api-actions">
              <AppButton
                size="small"
                @click="editApi(api)"
              >
                Editar
              </AppButton>
              
              <AppButton
                variant="danger"
                size="small"
                @click="deleteApi(api.id)"
              >
                Eliminar
              </AppButton>
            </div>
          </div>
          
          <div v-if="apis.length === 0" class="empty-state">
            <p>No hay APIs registradas. ¡Agrega la primera!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { APIConfig } from '~/types/api';
import { useApiManagement } from '~/composables/useApiManagement';

const { apis, registerNewApi, loadAllApis } = useApiManagement();
const editingApi = ref<APIConfig | null>(null);

const handleApiSubmit = async (apiConfig: APIConfig) => {
  try {
    await registerNewApi(apiConfig);
    if (editingApi.value) {
      editingApi.value = null;
    }
  } catch (error) {
    console.error('Error al registrar API:', error);
  }
};

const editApi = (api: APIConfig) => {
  editingApi.value = { ...api };
};

const deleteApi = (apiId: string) => {
  // Implementar lógica de eliminación
  console.log('Eliminar API:', apiId);
};

// Cargar APIs al montar el componente
onMounted(async () => {
  await loadAllApis();
});

useHead({
  title: 'Asistente API - Gestión de APIs'
});
</script>

<style scoped>
.apis-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.api-management {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.api-form-section,
.api-list-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.api-list-section h2 {
  margin-bottom: 1.5rem;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.api-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.api-info {
  flex: 1;
}

.api-info h3 {
  margin-bottom: 0.5rem;
}

.api-id {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.api-description {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.api-url {
  color: #007bff;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  word-break: break-all;
}

.api-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.keyword-tag {
  background: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #666;
}

.api-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

@media (max-width: 1024px) {
  .api-management {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .apis-page {
    padding: 1rem;
  }
  
  .api-card {
    flex-direction: column;
  }
  
  .api-actions {
    align-self: stretch;
    justify-content: center;
  }
}
</style>