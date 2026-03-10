<template>
  <div :class="['msg', role === 'user' ? 'user' : 'assistant']">
    <div class="bubble markdown-body" v-html="html"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdownIt } from '../utils/markdownIt'

const props = defineProps<{ role: string; text: string }>()

const html = computed(() => renderMarkdownIt(props.text || ''))
</script>

