<template>
  <div class="dashboard">
    <!-- Header del Dashboard -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1>Panel de Control</h1>
        <p>Gestión integral de APIs y Asistente IA</p>
        <div class="header-actions">
          <AppButton 
            variant="primary" 
            @click="refreshData"
            :loading="refreshing"
          >
            <span class="icon">🔄</span>
            Actualizar Datos
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Estadísticas principales -->
    <div class="stats-grid">
      <AppCard class="stat-card" variant="primary">
        <template #header>
          <h3>APIs Registradas</h3>
        </template>
        <div class="stat-content">
          <span class="stat-number">{{ stats.totalAPIs }}</span>
          <span class="stat-trend positive" v-if="stats.apiGrowth > 0">
            +{{ stats.apiGrowth }}%
          </span>
        </div>
        <template #footer>
          <NuxtLink to="/apis">Gestionar APIs →</NuxtLink>
        </template>
      </AppCard>

      <AppCard class="stat-card" variant="success">
        <template #header>
          <h3>APIs Saludables</h3>
        </template>
        <div class="stat-content">
          <span class="stat-number">{{ stats.healthyAPIs }}</span>
          <div class="stat-progress">
            <div 
              class="progress-bar" 
              :style="{ width: healthPercentage + '%' }"
            ></div>
          </div>
        </div>
        <template #footer>
          <span>{{ healthPercentage }}% de disponibilidad</span>
        </template>
      </AppCard>

      <AppCard class="stat-card" variant="warning">
        <template #header>
          <h3>Mensajes Hoy</h3>
        </template>
        <div class="stat-content">
          <span class="stat-number">{{ stats.todayMessages }}</span>
          <span class="stat-trend positive" v-if="stats.messageGrowth > 0">
            +{{ stats.messageGrowth }}%
          </span>
        </div>
        <template #footer>
          <span>Promedio: {{ stats.avgResponseTime }}ms</span>
        </template>
      </AppCard>

      <AppCard class="stat-card" variant="info">
        <template #header>
          <h3>Uso de Modelos</h3>
        </template>
        <div class="stat-content">
          <div class="model-usage">
            <div class="model-item">
              <span class="model-name">Claude</span>
              <span class="model-percent">{{ stats.claudeUsage }}%</span>
            </div>
            <div class="model-item">
              <span class="model-name">Gemini</span>
              <span class="model-percent">{{ stats.geminiUsage }}%</span>
            </div>
          </div>
        </div>
        <template #footer>
          <span>Total: {{ stats.totalRequests }} solicitudes</span>
        </template>
      </AppCard>
    </div>

    <!-- Gráficos y métricas -->
    <div class="charts-grid">
      <!-- Gráfico de salud de APIs -->
      <AppCard class="chart-card">
        <template #header>
          <h3>Estado de Salud de APIs</h3>
        </template>
        <div class="chart-container">
          <div class="health-chart">
            <div 
              v-for="api in apis" 
              :key="api.id"
              class="health-item"
              :class="getHealthStatus(api.id)"
            >
              <div class="health-info">
                <span class="api-name">{{ api.name }}</span>
                <span class="api-status">{{ getHealthStatusText(api.id) }}</span>
              </div>
              <div class="health-bar">
                <div 
                  class="status-indicator" 
                  :class="getHealthStatus(api.id)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Gráfico de uso de modelos -->
      <AppCard class="chart-card">
        <template #header>
          <h3>Distribución de Modelos IA</h3>
        </template>
        <div class="chart-container">
          <div class="pie-chart">
            <div class="chart-visual">
              <div 
                class="chart-segment claude" 
                :style="{ flex: stats.claudeUsage }"
              ></div>
              <div 
                class="chart-segment gemini" 
                :style="{ flex: stats.geminiUsage }"
              ></div>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="color-dot claude"></span>
                <span>Claude ({{ stats.claudeUsage }}%)</span>
              </div>
              <div class="legend-item">
                <span class="color-dot gemini"></span>
                <span>Gemini ({{ stats.geminiUsage }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- APIs recientes y actividad -->
    <div class="activity-grid">
      <!-- Lista de APIs recientes -->
      <AppCard class="activity-card">
        <template #header>
          <h3>APIs Recientes</h3>
        </template>
        <div class="api-list">
          <div 
            v-for="api in recentAPIs" 
            :key="api.id"
            class="api-list-item"
          >
            <div class="api-icon">🔌</div>
            <div class="api-details">
              <h4>{{ api.name }}</h4>
              <p>{{ api.description }}</p>
              <span class="api-url">{{ api.baseUrl }}</span>
            </div>
            <div class="api-status" :class="getHealthStatus(api.id)">
              {{ getHealthStatusText(api.id) }}
            </div>
          </div>
        </div>
        <template #footer>
          <NuxtLink to="/apis">Ver todas las APIs →</NuxtLink>
        </template>
      </AppCard>

      <!-- Actividad reciente -->
      <AppCard class="activity-card">
        <template #header>
          <h3>Actividad Reciente</h3>
        </template>
        <div class="activity-list">
          <div 
            v-for="(activity, index) in recentActivities" 
            :key="index"
            class="activity-item"
          >
            <div class="activity-icon">
              <span v-if="activity.type === 'chat'">💬</span>
              <span v-else-if="activity.type === 'api_call'">📡</span>
              <span v-else>⚡</span>
            </div>
            <div class="activity-details">
              <p>{{ activity.description }}</p>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>
        </div>
        <template #footer>
          <NuxtLink to="/chat">Ir al Chat →</NuxtLink>
        </template>
      </AppCard>
    </div>

    <!-- Acciones rápidas -->
    <div class="quick-actions">
      <h3>Acciones Rápidas</h3>
      <div class="actions-grid">
        <AppCard class="action-card">
          <div class="action-content" @click="navigateTo('/chat')">
            <span class="action-icon">💬</span>
            <h4>Nuevo Chat</h4>
            <p>Iniciar conversación con el asistente IA</p>
          </div>
        </AppCard>

        <AppCard class="action-card">
          <div class="action-content" @click="showApiModal = true">
            <span class="action-icon">➕</span>
            <h4>Registrar API</h4>
            <p>Agregar nueva API al sistema</p>
          </div>
        </AppCard>

        <AppCard class="action-card">
          <div class="action-content" @click="checkAllHealth">
            <span class="action-icon">📊</span>
            <h4>Verificar Salud</h4>
            <p>Comprobar estado de todas las APIs</p>
          </div>
        </AppCard>

        <AppCard class="action-card">
          <div class="action-content" @click="navigateTo('/apis')">
            <span class="action-icon">⚙️</span>
            <h4>Gestionar APIs</h4>
            <p>Configurar y administrar APIs</p>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Modal para registrar API -->
    <AppModal
      v-model:show="showApiModal"
      title="Registrar Nueva API"
      size="large"
    >
      <ApiForm @submit="handleApiSubmit" @cancel="showApiModal = false" />
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApiManagement } from '~/composables/useApiManagement';
import { useRouter } from 'vue-router';

const { apis, healthStatus, loadAllApis, checkApiHealth } = useApiManagement();
const router = useRouter();

const refreshing = ref(false);
const showApiModal = ref(false);

// Datos de ejemplo para las estadísticas
const stats = ref({
  totalAPIs: 0,
  healthyAPIs: 0,
  apiGrowth: 5,
  todayMessages: 42,
  messageGrowth: 12,
  avgResponseTime: 156,
  claudeUsage: 65,
  geminiUsage: 35,
  totalRequests: 128
});

// Actividades recientes de ejemplo
const recentActivities = ref([
  {
    type: 'chat',
    description: 'Consulta sobre usuarios del sistema Sabi',
    time: 'Hace 5 minutos'
  },
  {
    type: 'api_call',
    description: 'Llamada a API Sabi - /usuarios',
    time: 'Hace 12 minutos'
  },
  {
    type: 'health_check',
    description: 'Verificación de salud completada',
    time: 'Hace 20 minutos'
  },
  {
    type: 'chat',
    description: 'Consulta sobre métricas del sistema',
    time: 'Hace 35 minutos'
  }
]);

// Calcular porcentaje de salud
const healthPercentage = computed(() => {
  if (apis.value.length === 0) return 0;
  return Math.round((stats.value.healthyAPIs / apis.value.length) * 100);
});

// APIs más recientes
const recentAPIs = computed(() => {
  return apis.value.slice(0, 3);
});

// Obtener estado de salud
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

// Navegación
const navigateTo = (path: string) => {
  router.push(path);
};

// Refrescar datos
const refreshData = async () => {
  refreshing.value = true;
  try {
    await loadAllApis();
    await checkApiHealth();
    updateStats();
  } catch (error) {
    console.error('Error al actualizar datos:', error);
  } finally {
    refreshing.value = false;
  }
};

// Verificar salud de todas las APIs
const checkAllHealth = async () => {
  try {
    await checkApiHealth();
    updateStats();
  } catch (error) {
    console.error('Error al verificar salud:', error);
  }
};

// Manejar envío de API
const handleApiSubmit = async (apiConfig: any) => {
  try {
    // Aquí iría la lógica para registrar la API
    console.log('API registrada:', apiConfig);
    showApiModal.value = false;
    await refreshData();
  } catch (error) {
    console.error('Error al registrar API:', error);
  }
};

// Actualizar estadísticas
const updateStats = () => {
  const healthyCount = apis.value.filter(api => 
    healthStatus.value[api.id]?.status === 'healthy'
  ).length;

  stats.value.totalAPIs = apis.value.length;
  stats.value.healthyAPIs = healthyCount;
};

// Cargar datos iniciales
onMounted(async () => {
  await loadAllApis();
  await checkApiHealth();
  updateStats();
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.header-content p {
  margin: 0.5rem 0 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.header-actions .icon {
  margin-right: 0.5rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-content {
  padding: 1.5rem 0;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  display: block;
  margin-bottom: 0.5rem;
}

.stat-trend {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
}

.stat-trend.positive {
  background: #d4edda;
  color: #155724;
}

.stat-progress {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin: 1rem 0;
}

.progress-bar {
  height: 100%;
  background: #28a745;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.model-usage {
  text-align: left;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.model-name {
  font-weight: 500;
}

.model-percent {
  font-weight: 700;
  color: #007bff;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  height: 100%;
}

.chart-container {
  padding: 1rem 0;
}

.health-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.health-info {
  flex: 1;
}

.api-name {
  font-weight: 600;
  display: block;
}

.api-status {
  font-size: 0.875rem;
  color: #6c757d;
}

.health-bar {
  width: 60px;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.status-indicator {
  height: 100%;
  width: 100%;
}

.status-indicator.healthy {
  background: #28a745;
}

.status-indicator.unhealthy {
  background: #dc3545;
}

.status-indicator.unknown {
  background: #ffc107;
}

.pie-chart {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.chart-visual {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    #007bff 0% calc(var(--claude-percent) * 1%),
    #6f42c1 calc(var(--claude-percent) * 1%) 100%
  );
  flex-shrink: 0;
}

.chart-segment {
  height: 100%;
}

.chart-segment.claude {
  background: #007bff;
}

.chart-segment.gemini {
  background: #6f42c1;
}

.chart-legend {
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.color-dot.claude {
  background: #007bff;
}

.color-dot.gemini {
  background: #6f42c1;
}

/* Activity Grid */
.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.activity-card {
  height: 100%;
}

.api-list,
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.api-list-item,
.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.api-list-item:hover,
.activity-item:hover {
  background: #f8f9fa;
}

.api-icon,
.activity-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.api-details,
.activity-details {
  flex: 1;
}

.api-details h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.api-details p {
  margin: 0 0 0.25rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.api-url {
  font-size: 0.75rem;
  color: #007bff;
  word-break: break-all;
}

.api-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.api-status.healthy {
  background: #d4edda;
  color: #155724;
}

.api-status.unhealthy {
  background: #f8d7da;
  color: #721c24;
}

.api-status.unknown {
  background: #fff3cd;
  color: #856404;
}

.activity-details p {
  margin: 0 0 0.25rem;
  font-weight: 500;
}

.activity-time {
  font-size: 0.75rem;
  color: #6c757d;
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 2rem;
}

.quick-actions h3 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #2c3e50;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-content {
  text-align: center;
  padding: 1.5rem;
}

.action-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 1rem;
}

.action-content h4 {
  margin: 0 0 0.5rem;
  color: #2c3e50;
}

.action-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .dashboard-header {
    padding: 1.5rem;
    text-align: center;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .stats-grid,
  .charts-grid,
  .activity-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .pie-chart {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .api-list-item,
  .activity-item {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .health-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    padding: 1rem;
  }
  
  .header-content h1 {
    font-size: 1.75rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .chart-visual {
    width: 100px;
    height: 100px;
  }
}
</style>