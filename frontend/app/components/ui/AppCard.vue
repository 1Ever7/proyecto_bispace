<template>
  <div class="app-card" :class="[variant, size]">
    <div v-if="$slots.header || title" class="app-card-header">
      <slot name="header">
        <h3 v-if="title">{{ title }}</h3>
      </slot>
    </div>
    
    <div class="app-card-body">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="app-card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: String,
  variant: {
    type: String,
    default: 'default',
    validator: (value: string) => ['default', 'primary', 'secondary', 'success', 'warning', 'danger'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value: string) => ['small', 'medium', 'large'].includes(value)
  }
});
</script>

<style scoped>
.app-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.app-card.small {
  font-size: 0.875rem;
}

.app-card.medium {
  font-size: 1rem;
}

.app-card.large {
  font-size: 1.125rem;
}

.app-card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.app-card-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.app-card-body {
  padding: 1.5rem;
}

.app-card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

/* Variants */
.app-card.primary .app-card-header {
  background: #007bff;
  color: white;
}

.app-card.secondary .app-card-header {
  background: #6c757d;
  color: white;
}

.app-card.success .app-card-header {
  background: #28a745;
  color: white;
}

.app-card.warning .app-card-header {
  background: #ffc107;
  color: #212529;
}

.app-card.danger .app-card-header {
  background: #dc3545;
  color: white;
}
</style>