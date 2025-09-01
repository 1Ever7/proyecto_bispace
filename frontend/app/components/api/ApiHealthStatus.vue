<template>
  <div class="api-health-status">
    <h3>Estado de Salud de APIs</h3>
    
    <div class="health-cards">
      <div
        v-for="api in apis"
        :key="api.id"
        :class="['health-card', healthStatus[api.id]?.status || 'unknown']"
      >
        <div class="api-name">{{ api.name }}</div>
        <div class="api-id">{{ api.id }}</div>
        
        <div class="health-status">
          <span class="status-indicator" :class="healthStatus[api.id]?.status || 'unknown'"></span>
          {{ getStatusText(healthStatus[api.id]?.status) }}
        </div>
        
        <div v-if="healthStatus[api.id]?.responseTime" class="response-time">
          Tiempo de respuesta: {{ healthStatus[api.id]?.responseTime }}ms
        </div>
        
        <div v-if="healthStatus[api.id]?.error" class="error-message">
          Error: {{ healthStatus[api.id]?.error }}
        </div>
        
        <AppButton
          size="small"
          @click="checkHealth(api.id)"
          :loading="loading"
        >
          Verificar Salud
        </AppButton>
      </div>
    </div>
    
    <div class="health-actions">
      <AppButton
        @click="checkAllHealth"
        :loading="loading"
      >
        Verificar Salud de Todas las APIs
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApiManagement } from '~/composables/useApiManagement';

const { apis, healthStatus, loading, checkApiHealth } = useApiManagement();

const checkHealth = async (apiId: string) => {
  await checkApiHealth(apiId);
};

const checkAllHealth = async () => {
  await checkApiHealth();
};

const getStatusText = (status: string | undefined) => {
  switch (status) {
    case 'healthy': return 'Saludable';
    case 'unhealthy': return 'Con problemas';
    default: return 'Desconocido';
  }
};
</script>

<style scoped>
.api-health-status {
  margin-bottom: 2rem;
}

.health-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.health-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.health-card.healthy {
  border-color: #28a745;
  background-color: rgba(40, 167, 69, 0.05);
}

.health-card.unhealthy {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
}

.api-name {
  font-weight: bold;
  font-size: 1.1rem;
}

.api-id {
  color: #666;
  font-size: 0.9rem;
}

.health-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator.healthy {
  background-color: #28a745;
}

.status-indicator.unhealthy {
  background-color: #dc3545;
}

.status-indicator.unknown {
  background-color: #ffc107;
}

.response-time {
  font-size: 0.9rem;
  color: #666;
}

.error-message {
  font-size: 0.9rem;
  color: #dc3545;
  word-break: break-word;
}

.health-actions {
  display: flex;
  justify-content: center;
}
</style>