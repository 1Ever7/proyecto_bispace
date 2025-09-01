<template>
  <div class="api-list">
    <div class="api-list-header">
      <h3>APIs Registradas</h3>
      <AppButton @click="showRegisterModal = true">
        <span>+</span> Registrar Nueva API
      </AppButton>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando APIs...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>Error al cargar las APIs: {{ error }}</p>
      <AppButton @click="loadAPIs">Reintentar</AppButton>
    </div>
    
    <div v-else-if="apis.length === 0" class="empty-state">
      <p>No hay APIs registradas.</p>
      <p>Comienza registrando tu primera API para que el asistente pueda utilizarla.</p>
      <AppButton @click="showRegisterModal = true">
        Registrar Primera API
      </AppButton>
    </div>
    
    <div v-else class="api-grid">
      <div
        v-for="api in apis"
        :key="api.id"
        class="api-item"
        :class="getHealthStatus(api.id)"
      >
        <div class="api-info">
          <div class="api-name-status">
            <h4>{{ api.name }}</h4>
            <span class="status-badge" :class="getHealthStatus(api.id)">
              {{ getHealthStatusText(api.id) }}
            </span>
          </div>
          
          <p class="api-id">{{ api.id }}</p>
          <p class="api-description">{{ api.description }}</p>
          <p class="api-url">{{ api.baseUrl }}</p>
          
          <div class="api-keywords">
            <span
              v-for="keyword in api.keywords.slice(0, 3)"
              :key="keyword"
              class="keyword-tag"
            >
              {{ keyword }}
            </span>
            <span v-if="api.keywords.length > 3" class="more-keywords">
              +{{ api.keywords.length - 3 }} más
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
          
          <AppButton
            variant="secondary"
            size="small"
            @click="checkHealth(api.id)"
            :loading="healthLoading === api.id"
          >
            Verificar Salud
          </AppButton>
        </div>
      </div>
    </div>
    
    <!-- Modal de registro/edición -->
    <AppModal
      v-model:show="showRegisterModal"
      :title="editingApi ? 'Editar API' : 'Registrar Nueva API'"
      size="large"
    >
      <ApiForm
        :editing-api="editingApi"
        @submit="handleApiSubmit"
        @cancel="closeModal"
      />
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { APIConfig } from '~/types/api';
import { useApiManagement } from '~/composables/useApiManagement';

const { apis, healthStatus, loading, error, loadAllApis, checkApiHealth } = useApiManagement();

const showRegisterModal = ref(false);
const editingApi = ref<APIConfig | null>(null);
const healthLoading = ref<string | null>(null);

const loadAPIs = async () => {
  await loadAllApis();
};

const checkHealth = async (apiId: string) => {
  healthLoading.value = apiId;
  try {
    await checkApiHealth(apiId);
  } finally {
    healthLoading.value = null;
  }
};

const editApi = (api: APIConfig) => {
  editingApi.value = { ...api };
  showRegisterModal.value = true;
};

const deleteApi = (apiId: string) => {
  // Implementar lógica de eliminación
  if (confirm(`¿Estás seguro de que quieres eliminar la API ${apiId}?`)) {
    console.log('Eliminar API:', apiId);
    // Aquí iría la llamada al backend para eliminar la API
  }
};

const handleApiSubmit = async (apiConfig: APIConfig) => {
  try {
    // Esta función debería estar implementada en el composable useApiManagement
    console.log('API a registrar/actualizar:', apiConfig);
    // Aquí iría la llamada al backend para guardar la API
    
    // Cerrar modal y recargar lista
    closeModal();
    await loadAPIs();
  } catch (err) {
    console.error('Error al guardar API:', err);
  }
};

const closeModal = () => {
  showRegisterModal.value = false;
  editingApi.value = null;
};

const getHealthStatus = (apiId: string) => {
  return healthStatus.value[apiId]?.status || 'unknown';
};

const getHealthStatusText = (apiId: string) => {
  const status = getHealthStatus(apiId);
  switch (status) {
    case 'healthy': return 'Saludable';
    case 'unhealthy': return 'Con problemas';
    default: return 'Desconocido';
  }
};

// Cargar APIs al montar el componente
onMounted(() => {
  loadAPIs();
});
</script>

<style scoped>
.api-list {
  margin-bottom: 2rem;
}

.api-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.api-list-header h3 {
  margin: 0;
  font-size: 1.5rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state p {
  color: #dc3545;
  margin-bottom: 1rem;
}

.api-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.api-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.api-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.api-item.healthy {
  border-left: 4px solid #28a745;
}

.api-item.unhealthy {
  border-left: 4px solid #dc3545;
}

.api-item.unknown {
  border-left: 4px solid #ffc107;
}

.api-info {
  flex: 1;
}

.api-name-status {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.api-name-status h4 {
  margin: 0;
  font-size: 1.2rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.healthy {
  background: #d4edda;
  color: #155724;
}

.status-badge.unhealthy {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.unknown {
  background: #fff3cd;
  color: #856404;
}

.api-id {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.api-description {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.api-url {
  color: #007bff;
  font-size: 0.875rem;
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
  font-size: 0.75rem;
  color: #666;
}

.more-keywords {
  font-size: 0.75rem;
  color: #6c757d;
  align-self: center;
}

.api-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .api-grid {
    grid-template-columns: 1fr;
  }
  
  .api-list-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .api-actions {
    justify-content: center;
  }
}
</style>