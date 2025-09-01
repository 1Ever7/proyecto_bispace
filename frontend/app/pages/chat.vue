<template>
  <div class="chat-page">
    <div class="page-header">
      <h1>Chat con Asistente IA</h1>
      <p>Conversa con los modelos de IA que pueden acceder a tus APIs registradas</p>
    </div>
    
    <div class="chat-container">
      <ChatWindow />
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Asistente API - Chat'
});
</script>

<style scoped>
.chat-page {
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

.chat-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

@media (max-width: 768px) {
  .chat-page {
    padding: 1rem;
  }
}
</style>