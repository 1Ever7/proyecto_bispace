<template>
  <div class="message-list" ref="listRef">
    <div
      v-for="(message, index) in messages"
      :key="index"
      :class="['message', message.role]"
    >
      <div class="message-avatar">
        <span v-if="message.role === 'user'">👤</span>
        <span v-else>🤖</span>
      </div>
      
      <div class="message-content">
        <div class="message-text" v-html="formatMessage(message.content)"></div>
        <div class="message-time">
          {{ formatTime(message.timestamp) }}
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="message assistant">
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '~/types/chat';

defineProps({
  messages: {
    type: Array as PropType<Message[]>,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const listRef = ref<HTMLDivElement | null>(null);

const formatMessage = (content: string) => {
  // Convertir markdown básico a HTML
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
};

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Auto-scroll to bottom when new messages arrive
watch(() => [...props.messages], () => {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight;
    }
  });
}, { deep: true });

// Scroll to bottom on initial load
onMounted(() => {
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight;
  }
});
</script>

<style scoped>
.message-list {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  gap: 0.75rem;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.assistant {
  align-self: flex-start;
}

.message-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.message.user .message-avatar {
  background: #007bff;
  color: white;
}

.message-content {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  line-height: 1.4;
}

.message.user .message-content {
  background: #007bff;
  color: white;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-family: monospace;
}

.message.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.5rem;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #6c757d;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-3px); }
}

@media (max-width: 768px) {
  .message {
    max-width: 90%;
  }
  
  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }
}
</style>