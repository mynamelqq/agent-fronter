<template>
  <div class="usage-records-page">
    <div class="usage-records-header">
      <div class="usage-records-title-row">
        <h1>{{ t('调用记录', 'Usage Records') }}</h1>
        <span class="usage-records-badge">
          {{ t('实时', 'Live') }}
        </span>
      </div>
      <p>{{ t('查看你的模型调用明细与 Token 消耗', 'View model call details and token consumption') }}</p>
    </div>

    <div class="usage-records-toolbar">
      <div class="usage-records-actions">
        <button class="usage-records-btn usage-records-btn-primary" :disabled="loading" @click="refresh">
          {{ loading ? t('刷新中...', 'Refreshing...') : t('刷新', 'Refresh') }}
        </button>
      </div>
      <div class="usage-records-meta">
        {{ t('总记录', 'Total') }}: {{ formatInteger(total) }}
      </div>
    </div>

    <div class="usage-records-overview">
      <div class="usage-records-stat-card">
        <span class="usage-records-stat-label">{{ t('当前页记录', 'Page Records') }}</span>
        <strong>{{ formatInteger(records.length) }}</strong>
      </div>
      <div class="usage-records-stat-card">
        <span class="usage-records-stat-label">{{ t('当前页 Token', 'Page Tokens') }}</span>
        <strong>{{ formatInteger(pageTokenTotal) }}</strong>
      </div>
      <div class="usage-records-stat-card">
        <span class="usage-records-stat-label">{{ t('平均每次 Token', 'Avg Tokens/Call') }}</span>
        <strong>{{ formatInteger(avgTokenPerCall) }}</strong>
      </div>
      <div class="usage-records-stat-card">
        <span class="usage-records-stat-label">{{ t('模型数', 'Models') }}</span>
        <strong>{{ formatInteger(modelCount) }}</strong>
      </div>
    </div>

    <div class="usage-records-card">
      <div v-if="loading" class="usage-records-state">{{ t('加载中...', 'Loading...') }}</div>
      <div v-else-if="error" class="usage-records-state usage-records-error">{{ error }}</div>
      <div v-else-if="!records.length" class="usage-records-state">{{ t('暂无调用记录', 'No usage records') }}</div>
      <div v-else class="usage-records-table-wrap">
        <table class="usage-records-table">
          <thead style="user-select: none;">
            <tr>
              <th>ID</th>
              <th>{{ t('时间', 'Time') }}</th>
              <th>{{ t('模型', 'Model') }}</th>
              <th>{{ t('来源', 'Source') }}</th>
              <th>{{ t('类型', 'Type') }}</th>
              <th class="usage-records-th-num">{{ t('总 Token', 'Total Token') }}</th>
              <th class="usage-records-th-num">{{ t('输入', 'Prompt') }}</th>
              <th class="usage-records-th-num">{{ t('输出', 'Completion') }}</th>
              <th class="usage-records-th-num">{{ t('缓存', 'Cached') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in records" :key="item.id">
              <td class="mono">{{ item.id || '--' }}</td>
              <td>{{ formatTime(item.time) }}</td>
              <td class="usage-records-model-cell">
                <span class="model-brand-icon" :class="modelBrandClass(item.chatModel)">
                  {{ modelBrandIcon(item.chatModel) }}
                </span>
                <span class="usage-records-model-text">{{ item.chatModel || '--' }}</span>
              </td>
              <td>
                <span class="usage-records-chip">{{ formatFromWhere(item.fromWhere) }}</span>
              </td>
              <td>
                <span class="usage-records-chip usage-records-chip-muted">{{ formatType(item.type) }}</span>
              </td>
              <td class="usage-records-td-num">{{ formatInteger(item.token) }}</td>
              <td class="usage-records-td-num">{{ formatInteger(item.promptTokens) }}</td>
              <td class="usage-records-td-num">{{ formatInteger(item.completionTokens) }}</td>
              <td class="usage-records-td-num">{{ formatInteger(item.cachedTokens) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="usage-records-pagination">
      <button class="usage-records-btn" :disabled="loading || currentPage <= 1" @click="goPrev">
        {{ t('上一页', 'Prev') }}
      </button>
      <span>{{ t('第', 'Page') }} {{ currentPage }} / {{ totalPages }}</span>
      <button class="usage-records-btn" :disabled="loading || currentPage >= totalPages" @click="goNext">
        {{ t('下一页', 'Next') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { apiFetch } from '../api/http'
import { useUiLanguage } from '../composables/useUiLanguage'

type UsageRecord = {
  id: string
  userId: string
  type: string
  token: number
  time: string
  promptTokens: number
  cachedTokens: number
  chatModel: string
  fromWhere: string
  completionTokens: number
}

function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function toSafeInt(v: unknown, fallback = 0): number {
  const n = Math.floor(toNumber(v))
  return n > 0 ? n : fallback
}

const { t, uiLocale } = useUiLanguage()
const records = ref<UsageRecord[]>([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const pageTokenTotal = computed(() =>
  records.value.reduce((sum, item) => sum + Math.max(0, Math.floor(toNumber(item.token))), 0)
)
const avgTokenPerCall = computed(() =>
  records.value.length ? Math.round(pageTokenTotal.value / records.value.length) : 0
)
const modelCount = computed(() => {
  const models = new Set(records.value.map((item) => item.chatModel).filter((model) => model.trim()))
  return models.size
})

function formatInteger(v: unknown): string {
  const n = Math.max(0, Math.floor(toNumber(v)))
  return n.toLocaleString(uiLocale.value === 'en' ? 'en-US' : 'zh-CN')
}

function formatTime(v: unknown): string {
  if (!v) return '--'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(uiLocale.value === 'en' ? 'en-US' : 'zh-CN', { hour12: false })
}

function formatFromWhere(v: unknown): string {
  const text = String(v ?? '').trim().toLowerCase()
  if (!text) return '--'
  if (text === 'agent' || text.includes('智能体')) return t('智能体', 'Agent')
  if (text === 'chat' || text.includes('对话')) return t('对话', 'Chat')
  return String(v)
}

function formatType(v: unknown): string {
  const text = String(v ?? '').trim().toLowerCase()
  if (!text) return '--'
  if (text === 'user') return t('用户', 'User')
  if (text === 'anno' || text === 'anon' || text === 'anonymous') return t('游客', 'Guest')
  return String(v)
}

function modelBrandClass(v: unknown): string {
  const text = String(v ?? '').trim().toLowerCase()
  if (!text) return 'brand-openai'
  if (text.includes('gpt') || text.includes('o1') || text.includes('o3') || text.includes('openai')) {
    return 'brand-openai'
  }
  if (text.includes('claude') || text.includes('anthropic')) return 'brand-anthropic'
  if (text.includes('grok') || text.includes('xai')) return 'brand-xai'
  if (text.includes('gemini') || text.includes('google')) return 'brand-google'
  if (text.includes('deepseek')) return 'brand-deepseek'
  if (text.includes('qwen') || text.includes('tongyi')) return 'brand-qwen'
  if (text.includes('llama') || text.includes('meta')) return 'brand-meta'
  if (text.includes('kimi') || text.includes('moonshot')) return 'brand-moonshot'
  if (text.includes('glm') || text.includes('zai')) return 'brand-zai'
  return 'brand-openai'
}

function modelBrandIcon(v: unknown): string {
  const text = String(v ?? '').trim().toLowerCase()
  if (!text) return 'O'
  if (text.includes('gpt') || text.includes('o1') || text.includes('o3') || text.includes('openai')) return 'O'
  if (text.includes('claude') || text.includes('anthropic')) return 'A'
  if (text.includes('grok') || text.includes('xai')) return 'x'
  if (text.includes('gemini') || text.includes('google')) return 'G'
  if (text.includes('deepseek')) return 'D'
  if (text.includes('qwen') || text.includes('tongyi')) return 'Q'
  if (text.includes('llama') || text.includes('meta')) return 'M'
  if (text.includes('kimi') || text.includes('moonshot')) return 'K'
  if (text.includes('glm') || text.includes('zai')) return 'Z'
  return 'O'
}

function normalizeRecord(item: unknown): UsageRecord {
  const row = (item ?? {}) as Record<string, unknown>
  return {
    id: String(row.id ?? ''),
    userId: String(row.userId ?? row.user_id ?? ''),
    type: String(row.type ?? ''),
    token: toNumber(row.token),
    time: String(row.time ?? ''),
    promptTokens: toNumber(row.promptTokens ?? row.prompt_tokens),
    cachedTokens: toNumber(row.cachedTokens ?? row.cached_tokens),
    chatModel: String(row.chatModel ?? row.chat_model ?? ''),
    fromWhere: String(row.fromWhere ?? row.from_where ?? ''),
    completionTokens: toNumber(row.completionTokens ?? row.completion_tokens)
  }
}

async function load(page = currentPage.value) {
  loading.value = true
  error.value = ''
  try {
    const pageQuery = `?page=${encodeURIComponent(String(page))}`
    const primary = await apiFetch<any>(`/api/stat${pageQuery}`, { method: 'GET' })
    const resp = primary.ok ? primary : await apiFetch<any>(`/stat${pageQuery}`, { method: 'GET' })
    if (!resp.ok) throw new Error(resp.json?.message || 'request failed')
    const data = (resp.json?.data ?? {}) as Record<string, unknown>
    const list = Array.isArray(data.records) ? data.records : []
    records.value = list.map(normalizeRecord)
    currentPage.value = toSafeInt(data.current, page)
    totalPages.value = toSafeInt(data.pages, 1)
    total.value = Math.max(0, Math.floor(toNumber(data.total ?? list.length)))
  } catch (e) {
    records.value = []
    error.value =
      e instanceof Error && e.message
        ? e.message
        : t('加载调用记录失败，请稍后重试', 'Failed to load usage records, please try again later')
  } finally {
    loading.value = false
  }
}

function refresh() {
  load(currentPage.value)
}

function goPrev() {
  if (currentPage.value <= 1) return
  load(currentPage.value - 1)
}

function goNext() {
  if (currentPage.value >= totalPages.value) return
  load(currentPage.value + 1)
}

onMounted(() => {
  load(1)
})
</script>

<style scoped>
.usage-records-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.usage-records-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.usage-records-header h1 {
  margin: 0;
  user-select: none;
  font-size: clamp(1.35rem, 2.2vw, 1.75rem);
  letter-spacing: 0.01em;
}

.usage-records-header p {
  margin: 8px 0 0;
  color: var(--text-secondary);
}

.usage-records-badge {
  user-select: none;
  font-size: 0.72rem;
  line-height: 1;
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--success, #16a34a) 30%, transparent);
  color: var(--success, #16a34a);
  background: color-mix(in srgb, var(--success, #16a34a) 14%, transparent);
}

.usage-records-toolbar {
  user-select: none;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: color-mix(in srgb, var(--bg-secondary) 95%, var(--text-primary) 5%);
}

.usage-records-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-records-meta {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.usage-records-overview {
  margin-top: 12px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.usage-records-stat-card {
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 2px 12px color-mix(in srgb, var(--text-primary) 6%, transparent);
}

.usage-records-stat-label {
  color: var(--text-secondary);
  font-size: 0.78rem;
  user-select: none;
}

.usage-records-stat-card strong {
  font-size: 1.05rem;
  color: var(--text-primary);
}

.usage-records-card {
  margin-top: 12px;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--text-primary) 6%, transparent);
}

.usage-records-state {
  padding: 44px 24px;
  color: var(--text-secondary);
  text-align: center;
}

.usage-records-error {
  color: var(--danger);
}

.usage-records-table-wrap {
  width: 100%;
  overflow: auto;
}

.usage-records-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.usage-records-table th,
.usage-records-table td {
  border-bottom: 1px solid var(--border-light);
  padding: 12px;
  text-align: left;
  font-size: 0.875rem;
  color: var(--text-primary);
  white-space: nowrap;
}

.usage-records-table th {
  font-weight: 600;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 92%, var(--text-primary) 8%);
  position: sticky;
  top: 0;
  z-index: 1;
}

.usage-records-table tbody tr:hover {
  background: color-mix(in srgb, var(--bg-secondary) 90%, var(--text-primary) 10%);
}

.usage-records-th-num,
.usage-records-td-num {
  text-align: right !important;
}

.usage-records-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--text-primary) 12%, transparent);
  background: color-mix(in srgb, var(--bg-secondary) 78%, var(--text-primary) 22%);
  font-size: 0.78rem;
  line-height: 1;
}

.usage-records-chip-muted {
  color: var(--text-secondary);
  border-color: color-mix(in srgb, var(--text-primary) 10%, transparent);
  background: color-mix(in srgb, var(--bg-secondary) 90%, var(--text-primary) 10%);
}

.usage-records-model-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.usage-records-model-text {
  color: var(--text-primary);
}

.model-brand-icon {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.brand-anthropic { background: #d97706; }
.brand-xai { background: #111827; }
.brand-google { background: #2563eb; }
.brand-openai { background: #0f766e; }
.brand-moonshot { background: #7c3aed; }
.brand-meta { background: #0284c7; }
.brand-zai { background: #c2410c; }
.brand-deepseek { background: #1d4ed8; }
.brand-qwen { background: #4f46e5; }

@media (max-width: 768px) {
  .usage-records-model-cell {
    gap: 6px;
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.usage-records-pagination {
  user-select: none;
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 10px 0 2px;
}

.usage-records-btn {
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 10px;
  padding: 7px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.usage-records-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--text-primary) 20%, var(--border-light));
}

.usage-records-btn-primary {
  color: var(--text-on-primary, #fff);
  border-color: color-mix(in srgb, var(--primary, #2563eb) 60%, var(--border-light));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary, #2563eb) 86%, #fff 14%),
    color-mix(in srgb, var(--primary, #2563eb) 70%, #000 30%)
  );
}

.usage-records-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .usage-records-page {
    padding: 14px;
  }

  .usage-records-toolbar {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
  }

  .usage-records-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .usage-records-table th,
  .usage-records-table td {
    padding: 10px;
  }
}
</style>
