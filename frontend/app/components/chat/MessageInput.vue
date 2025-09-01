<template>
  <div class="message-input">
    <form @submit.prevent="handleSubmit">
      <div class="input-container">
        <input
          v-model="message"
          type="text"
          :placeholder="placeholder"
          :disabled="disabled"
          @keydown="handleKeydown"
          ref="inputRef"
        />
        
        <button
          type="submit"
          :disabled="disabled || !message.trim()"
          class="send-button"
          :class="{ disabled: disabled || !message.trim() }"
        >
          <span v-if="loading" class="spinner"></span>
          <span v-else>↗</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}>(), {
  disabled: false,
  loading: false,
  placeholder: 'Escribe tu mensaje...'
});

const emit = defineEmits(['send']);

const message = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const handleSubmit = () => {
  if (props.disabled || !message.value.trim()) return;
  
  const trimmedMessage = message.value.trim();
  emit('send', trimmedMessage);
  message.value = '';
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
};

// Exponer método para focus
const focus = () => {
  if (inputRef.value) {
    inputRef.value.focus();
  }
};

defineExpose({ focus });
</script>

<style scoped>
.message-input {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  background: white;
}

.input-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
}

input:focus {
  border-color: #007bff;
}

input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.send-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.send-button:hover:not(.disabled) {
  background: #0056b3;
}

.send-button.disabled {
  background: #ccc;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>