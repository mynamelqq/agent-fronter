<template>
  <div class="mcp-card" :class="{ collapsed }">
    <button type="button" class="card-header" @click="collapsed = !collapsed">
      <div class="head-left">
        <span class="mcp-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false">
            <path
              fill="currentColor"
              d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z"
            />
          </svg>
        </span>
        <div class="head-text">
          <span class="mcp-title">MCP: {{ resolvedToolName }}</span>
          <span v-if="summaryText" class="mcp-summary" :title="summaryText">{{ summaryText }}</span>
        </div>
      </div>
      <span v-if="costLabel" class="cost-text">· {{ costLabel }}</span>
      <span class="chevron">▾</span>
    </button>

    <div class="card-body" ref="bodyRef">
      <div class="section">
        <div class="section-label">{{ argsLabel }}</div>
        <template v-if="paramRows.length">
          <div v-for="(row, i) in paramRows" :key="i" class="param-row">
            <span class="param-key">{{ row.key }}</span>
            <span class="param-val">{{ row.val }}</span>
          </div>
        </template>
        <div v-else class="params-empty">{{ args ? formatJson(args) : '—' }}</div>
      </div>

      <div class="section">
        <div class="section-label">{{ resultLabel }}</div>
        <template v-if="hasResult">
          <div class="result-block" v-html="highlightJson(resultJson)"></div>
        </template>
        <div v-else class="result-block result-waiting">{{ waitingLabel }}</div>
      </div>

      <div class="card-actions">
        <button type="button" class="copy-btn" :disabled="!hasResult" @click.stop="copyResult">
          {{ copyBtnText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

type LangMode = 'zh' | 'en' | 'bilingual'

const props = withDefaults(
  defineProps<{
    toolName: string
    displayName?: string
    langMode?: LangMode
    args?: string
    result?: string | null
    cost?: number
  }>(),
  { args: '', result: null, langMode: 'zh' }
)

const bodyRef = ref<HTMLElement | null>(null)
const collapsed = ref(true)
const copyBtnText = ref('')

const hasResult = computed(() => !!props.result)
const resolvedToolName = computed(() => props.displayName || props.toolName)
const isZh = computed(() => props.langMode === 'zh')
const isEn = computed(() => props.langMode === 'en')
const argsLabel = computed(() => (isEn.value ? 'Args' : isZh.value ? '入参' : '入参 / Args'))
const resultLabel = computed(() => (isEn.value ? 'Result' : isZh.value ? '结果' : '结果 / Result'))
const waitingLabel = computed(() =>
  isEn.value ? 'Waiting for result...' : isZh.value ? '等待工具返回结果…' : '等待结果 / Waiting...'
)
const summaryText = computed(() => {
  const a = summarizeArgs(props.args)
  const r = summarizeResult(props.result)
  if (a && r) return `${a} -> ${r}`
  if (a) return a
  if (r) return r
  return ''
})
const costLabel = computed(() => {
  const ms = typeof props.cost === 'number' ? props.cost : 0
  if (!ms || ms <= 0) return ''
  return `${Math.round(ms)}ms`
})

function parseJson(str: string | null | undefined): unknown {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

const paramRows = computed(() => {
  if (!props.args) return []
  const obj = parseJson(props.args)
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).map(([key, val]) => ({
    key,
    val: typeof val === 'string' ? val : JSON.stringify(val)
  }))
})

const resultJson = computed(() => {
  if (!props.result) return ''
  try {
    const parsed = JSON.parse(props.result)
    return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
  } catch {
    return props.result
  }
})

function formatJson(str: string): string {
  if (!str) return ''
  const parsed = parseJson(str)
  if (parsed === null) return str
  return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function highlightJson(jsonStr: string): string {
  if (!jsonStr) return ''
  return jsonStr
    .replace(/"(?:[^"\\]|\\.)*"(?=\s*:)/g, (m) => `<span class="json-key">${escapeHtml(m)}</span>`)
    .replace(/: "(.*?)"/g, (_, s) => {
      const escaped = escapeHtml('"' + (s || '') + '"')
      return ': <span class="json-string">' + escaped + '</span>'
    })
    .replace(/: (true)\b/g, ': <span class="json-bool-t">$1</span>')
    .replace(/: (false)\b/g, ': <span class="json-bool-f">$1</span>')
    .replace(/: (null)\b/g, ': <span class="json-null">$1</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span class="json-num">$1</span>')
}

function copyResult() {
  if (!hasResult.value) return
  const text = resultJson.value
  navigator.clipboard.writeText(text).then(() => {
    copyBtnText.value = isEn.value ? 'Copied' : isZh.value ? '已复制' : '已复制 / Copied'
    setTimeout(() => {
      copyBtnText.value = isEn.value ? 'Copy Result' : isZh.value ? '复制结果' : '复制结果 / Copy'
    }, 1200)
  })
}

function shortText(s: string, max = 56): string {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  if (!t) return ''
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

function summarizeArgs(args?: string): string {
  if (!args) return ''
  const obj = parseJson(args)
  if (!obj || typeof obj !== 'object') return shortText(args, 42)
  const o = obj as Record<string, unknown>
  const keys = ['query', 'keyword', 'keywords', 'command', 'prompt', 'text', 'location', 'address', 'city', 'url', 'path', 'fileName', 'name']
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'string' && v.trim()) return shortText(v, 42)
    if (typeof v === 'number' || typeof v === 'boolean') return `${k}=${String(v)}`
  }
  const first = Object.entries(o).find(([, v]) => typeof v === 'string' && String(v).trim())
  if (first) return shortText(String(first[1]), 42)
  return ''
}

function summarizeResult(result?: string | null): string {
  if (!result) return ''
  const parsed = parseJson(result)
  if (Array.isArray(parsed)) {
    return isEn.value ? `${parsed.length} items` : isZh.value ? `${parsed.length} 条结果` : `${parsed.length} results`
  }
  if (parsed && typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>
    const listKeys = ['results', 'items', 'list', 'rows', 'hits', 'pois', 'data']
    for (const k of listKeys) {
      const v = o[k]
      if (Array.isArray(v)) {
        const n = v.length
        return isEn.value ? `${n} items` : isZh.value ? `${n} 条结果` : `${n} results`
      }
    }
    if (typeof o.count === 'number') {
      const n = o.count
      return isEn.value ? `${n} items` : isZh.value ? `${n} 条结果` : `${n} results`
    }
    if (typeof o.total === 'number') {
      const n = o.total
      return isEn.value ? `${n} total` : isZh.value ? `共 ${n} 条` : `${n} total`
    }
    const msg = o.summary ?? o.message ?? o.content
    if (typeof msg === 'string' && msg.trim()) return shortText(msg, 42)
  }
  return shortText(result, 42)
}

function updateBodyHeight() {
  const el = bodyRef.value
  if (!el) return
  el.style.maxHeight = collapsed.value ? '0' : `${el.scrollHeight}px`
}

watch(
  () => [props.result, collapsed.value],
  async () => {
    await nextTick()
    updateBodyHeight()
  },
  { immediate: true }
)

watch(
  () => props.langMode,
  () => {
    copyBtnText.value = isEn.value ? 'Copy Result' : isZh.value ? '复制结果' : '复制结果 / Copy'
  },
  { immediate: true }
)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Sora:wght@400;500;600&display=swap');

.mcp-card {
  width: 100%;
  max-width: min(98%, 1060px);
  border-radius: 12px;
  border: 1px solid #dbe1eb;
  background: #f4f6fb;
  overflow: hidden;
  margin: 8px 0;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
  font-family: 'Sora', sans-serif;
}

.card-header {
  width: 100%;
  border: none;
  padding: 12px 14px;
  background: #eef2f8;
  border-bottom: 1px solid #d9e1ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.head-left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.head-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mcp-icon {
  width: 20px;
  height: 20px;
  color: #4f46e5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mcp-icon svg {
  width: 18px;
  height: 18px;
}

.mcp-title {
  font-size: 12px;
  line-height: 1.2;
  color: #3f3d56;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mcp-summary {
  font-size: 11px;
  line-height: 1.2;
  color: #6d7487;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 720px;
}

.chevron {
  color: #7c8396;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.cost-text {
  margin-left: auto;
  margin-right: 10px;
  color: #8b93a7;
  font-size: 12px;
  line-height: 1;
}

.mcp-card.collapsed .chevron {
  transform: rotate(-90deg);
}

.card-body {
  overflow: hidden;
  transition: max-height 0.28s ease;
}

.section {
  padding: 12px 14px;
  border-bottom: 1px solid #e1e6ef;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #667085;
  margin-bottom: 8px;
}

.param-row,
.params-empty {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
}

.param-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 8px;
}

.param-key {
  color: #667085;
}

.param-val {
  color: #1f2937;
  word-break: break-all;
}

.params-empty {
  color: #98a2b3;
}

.result-block {
  max-height: 260px;
  overflow: auto;
  border: 1px solid #d4dbe7;
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #1f2937;
}

.result-waiting {
  color: #98a2b3;
  font-style: italic;
}

.result-block :deep(.json-key) {
  color: #64748b;
}

.result-block :deep(.json-string) {
  color: #334155;
}

.result-block :deep(.json-bool-t) {
  color: #16a34a;
}

.result-block :deep(.json-bool-f) {
  color: #dc2626;
}

.result-block :deep(.json-null) {
  color: #94a3b8;
}

.result-block :deep(.json-num) {
  color: #2563eb;
}

.card-actions {
  padding: 10px 14px;
  display: flex;
  justify-content: flex-end;
}

.copy-btn {
  border: 1px solid #d0d7e2;
  background: #ffffff;
  color: #475467;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.copy-btn:hover:not(:disabled) {
  border-color: #b9c4d3;
  background: #f8fafc;
}

.copy-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
