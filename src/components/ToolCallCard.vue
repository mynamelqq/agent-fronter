<template>
  <div class="tool-card" :class="{ collapsed }">
    <!-- 头部：图标、工具名、状态、折叠箭头 -->
    <div class="card-header" @click="collapsed = !collapsed">
      <div class="tool-icon">🔧</div>
      <span class="tool-name">{{ toolName }}</span>
      <div class="status-badge" :class="statusClass">
        <div class="status-dot"></div>
        {{ statusText }}
      </div>
      <span v-if="costLabel" class="tool-cost">· {{ costLabel }}</span>
      <span class="chevron">▾</span>
    </div>

    <div class="card-body" ref="bodyRef">
      <!-- 入参 -->
      <div class="section">
        <div class="section-label">入参</div>
        <template v-if="paramRows.length">
          <div v-for="(row, i) in paramRows" :key="i" class="param-row">
            <span class="param-key">{{ row.key }}</span>
            <span class="param-val">{{ row.val }}</span>
          </div>
        </template>
        <div v-else class="params-empty">{{ args ? formatJson(args) : '—' }}</div>
      </div>

      <!-- 结果 -->
      <div class="section">
        <div class="section-label">结果</div>
        <!-- 终端工具且失败：错误横幅 + 下方仍显示完整 JSON -->
        <div v-if="isTerminalResult && terminalError" class="error-banner">
          <span class="error-icon">⛔</span>
          <span class="error-msg">{{ terminalError }}</span>
        </div>
        <!-- 终端工具且成功且有 stdout/stderr 或成功无输出：优化展示 -->
        <template v-else-if="isTerminalResult && resultObj && !terminalError && (resultObj.stdout || resultObj.stderr || resultObj.success === true)">
          <div class="result-block terminal-output">
            <div v-if="resultObj.stdout" class="terminal-stdout">
              <span class="terminal-label">stdout</span>
              <pre class="terminal-pre">{{ resultObj.stdout }}</pre>
            </div>
            <div v-if="resultObj.stderr" class="terminal-stderr">
              <span class="terminal-label">stderr</span>
              <pre class="terminal-pre">{{ resultObj.stderr }}</pre>
            </div>
            <div v-if="!resultObj.stdout && !resultObj.stderr && resultObj.success === true" class="terminal-empty">
              命令已成功执行，无输出
            </div>
          </div>
        </template>
        <!-- 其余有结果时：显示 JSON（终端失败/无输出/非终端工具） -->
        <template v-else-if="hasResult">
          <div class="result-block json-block" v-html="highlightJson(resultJson)"></div>
        </template>
        <!-- 运行中 -->
        <div v-else class="result-block result-waiting">等待执行完成…</div>
      </div>
    </div>

    <div class="card-footer">
      <span class="footer-meta">{{ footerMeta }}</span>
      <button type="button" class="copy-btn" :disabled="!hasResult" @click.stop="copyResult">
        {{ copyBtnText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

/** 终端执行结果结构（execute_command / execTerminal 等） */
interface TerminalResult {
  success?: boolean
  stdout?: string
  stderr?: string
  exitCode?: number
  errorType?: string
  command?: string
  cwd?: string
}

const props = withDefaults(
  defineProps<{
    toolName: string
    args?: string
    result?: string | null
    /** 单次工具调用耗时（毫秒），由后端 cost 字段提供 */
    cost?: number
  }>(),
  { args: '', result: null }
)

const bodyRef = ref<HTMLElement | null>(null)
const collapsed = ref(true)
const copyBtnText = ref('复制结果')

/** 是否为终端/执行命令类工具（前端调用 execTerminal 等） */
const TERMINAL_TOOL_NAMES = ['execute_command', 'exec_terminal', 'exec_command', 'execTerminal', 'executeCommand']

const hasResult = computed(() => !!props.result)

function parseJson(str: string | null | undefined): unknown {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

const statusClass = computed(() => {
  if (!hasResult.value) return 'running'
  const obj = parseJson(props.result) as Record<string, unknown> | null
  if(!obj||obj.success==true)return 'success'
  return 'error'
})

const statusText = computed(() => {
  if (!hasResult.value) return '运行中'
  const obj = parseJson(props.result) as Record<string, unknown> | null
  if (!obj || obj.success == true) return '已完成'
  return '失败'
})

const costLabel = computed(() => {
  const ms = typeof props.cost === 'number' ? props.cost : 0
  if (!ms || ms <= 0) return ''
  // 直接展示毫秒，避免语义混淆
  return `${Math.round(ms)}ms`
})

/** 解析入参为 key-val 行，用于展示 */
const paramRows = computed(() => {
  if (!props.args) return []
  const obj = parseJson(props.args)
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).map(([key, val]) => ({
    key,
    val: typeof val === 'string' ? val : JSON.stringify(val)
  }))
})

/** 是否为“终端执行”类工具 */
const isTerminalTool = computed(() =>
  TERMINAL_TOOL_NAMES.some((name) => props.toolName === name || props.toolName.toLowerCase() === name.toLowerCase())
)

/** 解析后的结果对象（用于终端优化展示） */
const resultObj = computed((): TerminalResult | null => {
  if (!hasResult.value || !props.result) return null
  const o = parseJson(props.result)
  if (!o || typeof o !== 'object') return null
  return o as TerminalResult
})

/** 是否为终端结果结构（含 success / stdout / stderr / exitCode 等） */
const isTerminalResult = computed(() => {
  if (!isTerminalTool.value || !resultObj.value) return false
  const o = resultObj.value
  return typeof o === 'object' && ('success' in o || 'stdout' in o || 'stderr' in o || 'exitCode' in o)
})

/** 终端错误信息（PERMISSION_DENIED 等） */
const terminalError = computed(() => {
  const o = resultObj.value
  if (!o) return ''
  if (o.success === false && o.errorType) return `${o.errorType} — ${o.stderr || '命令执行失败'}`
  if (o.stderr && o.success === false) return String(o.stderr)
  return ''
})

/** 结果区展示用的 JSON 字符串 */
const resultJson = computed(() => {
  if (!props.result) return ''
  try {
    const parsed = JSON.parse(props.result)
    return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
  } catch {
    return props.result
  }
})

const footerMeta = computed(() => {
  if (!hasResult.value) return 'running…'
  const obj = resultObj.value
  if (obj && 'exitCode' in obj) {
    const exitCode = obj.exitCode
    const err = obj.errorType
    if (err) return `exit ${exitCode} · ${err}`
    return `exit ${exitCode}`
  }
  return ''
})

function formatJson(str: string): string {
  if (!str) return ''
  const parsed = parseJson(str)
  if (parsed === null) return str
  return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
}

/** 简单 JSON 高亮（key/string/bool/null/num） */
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

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function copyResult() {
  if (!hasResult.value) return
  const card = bodyRef.value?.closest('.tool-card')
  const block = card?.querySelector('.result-block:not(.result-waiting)')
  const text = block?.textContent?.trim() ?? resultJson.value
  navigator.clipboard.writeText(text).then(() => {
    copyBtnText.value = '已复制 ✓'
    setTimeout(() => (copyBtnText.value = '复制结果'), 1500)
  })
}

function updateBodyHeight() {
  const el = bodyRef.value
  if (!el) return
  if (collapsed.value) {
    el.style.maxHeight = '0'
  } else {
    const h = el.scrollHeight
    el.style.maxHeight = h ? `${h}px` : 'none'
  }
}

watch(
  () => [props.result, collapsed.value],
  async () => {
    await nextTick()
    updateBodyHeight()
  },
  { immediate: true }
)

// 内容变化后重新计算高度（如流式结果更新）
watch(
  () => props.result,
  async () => {
    if (collapsed.value) return
    await nextTick()
    requestAnimationFrame(updateBodyHeight)
  }
)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Sora:wght@300;400;500;600&display=swap');

.tool-card {
  width: 100%;
  max-width: 680px;
  background: #fafafa;
  border: 1px solid #e8e8ec;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  animation: slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  margin: 6px 0;
  font-family: 'Sora', 'Inter', sans-serif;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f7;
  border-bottom: 1px solid #e8e8ec;
  cursor: pointer;
  user-select: none;
}

.tool-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #ebebef;
  border: 1px solid #e0e0e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

.tool-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  letter-spacing: 0.01em;
  flex: 1;
}

.tool-cost {
  font-size: 11px;
  color: #6b7280;
  margin-left: 4px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 16px;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.status-badge.success {
  background: rgba(34, 197, 94, 0.08);
  color: #059669;
  border: 1px solid rgba(34, 197, 94, 0.18);
}

.status-badge.error {
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  border: 1px solid rgba(220, 38, 38, 0.18);
}

.status-badge.running {
  background: rgba(59, 130, 246, 0.08);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.18);
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.status-badge.success .status-dot {
  background: #059669;
}

.status-badge.error .status-dot,
.status-badge.running .status-dot {
  animation: pulse 1.5s infinite;
}

.status-badge.error .status-dot {
  background: #b91c1c;
}

.status-badge.running .status-dot {
  background: #2563eb;
  animation-duration: 1s;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.chevron {
  color: #9ca3af;
  font-size: 11px;
  transition: transform 0.2s;
}

.tool-card.collapsed .chevron {
  transform: rotate(-90deg);
}

.card-body {
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.section {
  padding: 8px 12px;
  border-bottom: 1px solid #eeeef2;
}

.section:last-child {
  border-bottom: none;
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.params-empty,
.param-row {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.params-empty {
  color: #9ca3af;
  font-style: italic;
}

.param-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}

.param-row:last-child {
  margin-bottom: 0;
}

.param-key {
  color: #6b7280;
  flex-shrink: 0;
  min-width: 80px;
}

.param-val {
  color: #374151;
  word-break: break-all;
}

.result-block {
  max-height: 150px;
  overflow-y: auto;
  background: #f5f5f7;
  border: 1px solid #e8e8ec;
  border-radius: 8px;
  padding: 12px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.7;
  overflow-x: auto;
  color: #374151;
}

.result-block.result-waiting {
  color: #9ca3af;
  font-style: italic;
}

.json-block :deep(.json-key) {
  color: #6b7280;
}

.json-block :deep(.json-string) {
  color: #4b5563;
}

.json-block :deep(.json-bool-f) {
  color: #b91c1c;
}

.json-block :deep(.json-bool-t) {
  color: #059669;
}

.json-block :deep(.json-null) {
  color: #9ca3af;
}

.json-block :deep(.json-num) {
  color: #7c3aed;
}

.error-banner {
  display: flex;
  max-height: 120px;
  overflow-y: auto;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(220, 38, 38, 0.06);
  border: 1px solid rgba(220, 38, 38, 0.15);
  border-radius: 6px;
  font-size: 11px;
  color: #b91c1c;
  margin-bottom: 8px;
}

.error-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.error-msg {
  font-family: 'JetBrains Mono', monospace;
}

/* 终端工具优化：stdout/stderr 分块 */
.terminal-output {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.terminal-stdout,
.terminal-stderr {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e8e8ec;
}

.terminal-stdout {
  background: #f5f5f7;
}

.terminal-stderr {
  background: rgba(220, 38, 38, 0.05);
  border-color: rgba(220, 38, 38, 0.15);
}

.terminal-label {
  display: block;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
  padding: 4px 8px;
  border-bottom: 1px solid #e8e8ec;
}

.terminal-stderr .terminal-label {
  color: #b91c1c;
}

.terminal-pre {
  margin: 0;
  padding: 6px 10px;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  color: #374151;
}

.terminal-stderr .terminal-pre {
  color: #b91c1c;
}

.terminal-empty {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}

.card-footer {
  padding: 6px 12px;
  background: #f5f5f7;
  border-top: 1px solid #eeeef2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-meta {
  font-size: 10px;
  color: #6b7280;
  font-family: 'JetBrains Mono', monospace;
}

.footer-meta span {
  color: #9ca3af;
}

.copy-btn {
  font-size: 10px;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  padding: 3px 8px;
  cursor: pointer;
  font-family: 'Sora', 'Inter', sans-serif;
  transition: all 0.15s;
  letter-spacing: 0.02em;
}

.copy-btn:hover:not(:disabled) {
  color: #374151;
  border-color: #d1d5db;
  background: #fafafa;
}

.copy-btn:disabled {
  opacity: 0.45;
  cursor: default;
}
</style>
