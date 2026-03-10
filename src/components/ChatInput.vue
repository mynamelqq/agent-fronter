<template>
  <div class="chat-input">
    <input
      v-model="value"
      @keydown.enter="onSend"
      placeholder="输入消息，回车发送"
      aria-label="聊天输入"
    />
    <button @click="onSend" aria-label="发送">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="btn-icon" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
      </svg>
      发送
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['send'])
const value = ref('')

function onSend() {
  if (!value.value.trim()) return
  emit('send', value.value)
  value.value = ''
}
</script>

