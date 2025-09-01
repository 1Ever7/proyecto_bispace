<template>
  <div class="chat-window">
    <div class="chat-header">
      <h3>Asistente de IA</h3>
      <div class="chat-controls">
        <select v-model="selectedModel" @change="updateModel">
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
        </select>
        
        <select v-model="selectedApi" @change="updateApi">
          <option :value="null">Sin API específica</option>
          <option
            v-for="api in availableApis"
            :key="api.id"
            :value="api.id"
          >
            {{ api.name }}
          </option>
        </select>
        
        <AppButton
          variant="secondary"
          size="small"
          @click="clearChat"
        >
          Limpiar Chat
        </AppButton>
      </div>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="message in messages"
        :key="message.id"
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
    
    <div class="chat-input">
      <form @submit.prevent="sendMessage">
        <div class="input-group">
          <input
            v-model="currentMessage"
            type="text"
            placeholder="Escribe tu mensaje..."
            :disabled="loading"
            ref="messageInput"
          />
          <AppButton
            type="submit"
            :disabled="loading || !currentMessage.trim()"
          >
            <span v-if="loading">Enviando...</span>
            <span v-else>Enviar</span>
          </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '~/stores/chat.store';
import { useApiStore } from '~/stores/api.store';

const chatStore = useChatStore();
const apiStore = useApiStore();

const currentMessage = ref('');
const selectedModel = ref(chatStore.selectedModel);
const selectedApi = ref(chatStore.selectedApi);
const messageInput = ref<HTMLInputElement | null>(null);
const messagesContainer = ref<HTMLDivElement | null>(null);

const messages = computed(() => chatStore.messages);
const loading = computed(() => chatStore.loading);
const availableApis = computed(() => apiStore.apis);

const updateModel = () => {
  chatStore.setModel(selectedModel.value);
};

const updateApi = () => {
  chatStore.setApi(selectedApi.value);
};

const sendMessage = async () => {
  if (!currentMessage.value.trim() || loading.value) return;
  
  const message = currentMessage.value;
  currentMessage.value = '';
  
  await chatStore.sendMessage(message);
  
  // Scroll to bottom after new message
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const clearChat = () => {
  chatStore.clearMessages();
};

const formatMessage = (content: string) => {
  // Basic markdown to HTML formatting
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
};

const formatTime = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString();
};

// Focus input on mount
onMounted(() => {
  if (messageInput.value) {
    messageInput.value.focus();
  }
});

// Scroll to bottom when messages change
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}, { deep: true });
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  padding: 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.chat-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.chat-controls select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
  gap: 10px;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.message-content {
  background: #f1f3f5;
  padding: 10px 15px;
  border-radius: 18px;
  line-height: 1.4;
}

.message.user .message-content {
  background: #007bff;
  color: white;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
}

.message.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 5px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
}

.chat-input {
  padding: 15px;
  border-top: 1px solid #ddd;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input-group input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

.input-group input:focus {
  border-color: #007bff;
}

@media (max-width: 768px) {
  .chat-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chat-controls {
    justify-content: center;
  }
  
  .message {
    max-width: 90%;
  }
}
</style>