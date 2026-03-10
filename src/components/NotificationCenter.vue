<template>
  <el-popover
    v-if="loggedIn"
    v-model:visible="visible"
    trigger="click"
    placement="bottom-end"
    :width="820"
    popper-class="notification-center-popper"
  >
    <template #reference>
      <button class="notification-trigger" :title="t('通知', 'Notifications')" type="button">
        <span class="notification-trigger-icon">🔔</span>
        <span v-if="unreadCount > 0" class="notification-trigger-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
    </template>

    <div class="notification-panel">
      <div class="notification-panel-header">
        <div class="notification-panel-title">{{ t('消息', 'Messages') }}</div>
        <div class="notification-panel-actions">
          <button
            class="notification-panel-link"
            type="button"
            :disabled="loading"
            @click="refreshList"
          >
            {{ t('刷新', 'Refresh') }}
          </button>
          <button
            class="notification-panel-link"
            type="button"
            :disabled="loading || unreadCount <= 0"
            @click="handleReadAll"
          >
            {{ t('全部已读', 'Mark all as read') }}
          </button>
        </div>
      </div>

      <div class="notification-layout">
        <div class="notification-master">
          <div class="notification-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              class="notification-tab"
              :class="{ active: status === tab.value }"
              type="button"
              @click="setStatus(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>

          <div v-if="loading" class="notification-state">{{ t('加载中...', 'Loading...') }}</div>
          <div v-else-if="items.length === 0" class="notification-state">
            {{ t('暂无更多消息', 'No messages yet') }}
          </div>
          <div v-else class="notification-list">
            <button
              v-for="item in items"
              :key="item.id"
              class="notification-item"
              :class="{ unread: !item.read, active: selectedId === item.id }"
              type="button"
              @click="selectMessage(item)"
            >
              <div class="notification-item-main">
                <div class="notification-item-title">{{ item.title || t('系统通知', 'System notification') }}</div>
                <div class="notification-item-content">{{ item.content || '-' }}</div>
                <div class="notification-item-time">{{ formatTime(item.createdAt) }}</div>
              </div>
              <span v-if="!item.read" class="notification-item-dot"></span>
            </button>
          </div>

          <div class="notification-footer" v-if="items.length > 0">
            <button
              type="button"
              class="notification-more"
              :disabled="loadingMore || !hasMore"
              @click="loadMore"
            >
              {{
                loadingMore
                  ? t('加载中...', 'Loading...')
                  : hasMore
                    ? t('加载更多', 'Load more')
                    : t('没有更多了', 'No more')
              }}
            </button>
          </div>
        </div>

        <div class="notification-detail">
          <template v-if="currentMessage">
            <h3 class="notification-detail-title">{{ currentMessage.title || t('系统通知', 'System notification') }}</h3>
            <div class="notification-detail-time">{{ formatTime(currentMessage.createdAt) }}</div>
            <article class="notification-detail-content" v-html="currentMessageHtml"></article>
          </template>
          <div v-else class="notification-state notification-detail-empty">
            {{ t('请选择一条消息查看详情', 'Select a message to view details') }}
          </div>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { NotificationStatus, NotificationItem } from '../api/notifications'
import { useNotificationStore } from '../stores/notifications'
import { useUiLanguage } from '../composables/useUiLanguage'
import { isLoggedIn } from '../stores/auth'
import { transformMarkdownForStream } from '../utils/markdown'

const visible = ref(false)
const store = useNotificationStore()
const { t, uiLocale } = useUiLanguage()

const tabs = computed(() => [
  { value: 'all' as NotificationStatus, label: t('全部', 'All') },
  { value: 'unread' as NotificationStatus, label: t('未读', 'Unread') },
  { value: 'read' as NotificationStatus, label: t('已读', 'Read') }
])

const items = computed(() => store.items.value)
const unreadCount = computed(() => store.unreadCount.value)
const status = computed(() => store.status.value)
const loading = computed(() => store.loading.value)
const loadingMore = computed(() => store.loadingMore.value)
const hasMore = computed(() => store.hasMore.value)
const loggedIn = ref(isLoggedIn())
const selectedId = ref('')
const currentMessage = computed(() => items.value.find((it) => it.id === selectedId.value) ?? null)
const currentMessageHtml = computed(() =>
  transformMarkdownForStream(currentMessage.value?.content || '', { allowEmpty: true })
)

function handleAuthUpdated() {
  loggedIn.value = isLoggedIn()
  if (!loggedIn.value) {
    visible.value = false
    selectedId.value = ''
  }
}

function formatTime(raw?: string) {
  if (!raw) return '-'
  const dt = new Date(raw)
  if (Number.isNaN(dt.getTime())) return raw
  return dt.toLocaleString(uiLocale.value === 'en' ? 'en-US' : 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

async function setStatus(next: NotificationStatus) {
  await store.setStatus(next)
}

async function refreshList() {
  await store.refreshList()
}

async function loadMore() {
  await store.loadMore()
}

async function handleReadAll() {
  await store.readAll()
  selectedId.value = items.value[0]?.id || ''
}

async function selectMessage(item: NotificationItem) {
  selectedId.value = item.id
  if (!item.read) {
    await store.readOne(item.id)
  }
}

onMounted(() => {
  window.addEventListener('auth:updated', handleAuthUpdated)
  store.init()
})

onBeforeUnmount(() => {
  window.removeEventListener('auth:updated', handleAuthUpdated)
  store.dispose()
})

watch(
  items,
  (list) => {
    if (!list.length) {
      selectedId.value = ''
      return
    }
    if (!selectedId.value || !list.some((it) => it.id === selectedId.value)) {
      selectedId.value = list[0].id
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.notification-trigger {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  position: relative;
}

.notification-trigger:hover {
  background: rgba(15, 23, 42, 0.06);
}

.notification-trigger-icon {
  font-size: 16px;
  line-height: 1;
}

.notification-trigger-badge {
  position: absolute;
  right: -2px;
  top: -2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
}

.notification-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(90vw, 820px);
}

.notification-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.notification-panel-title {
  font-size: 15px;
  font-weight: 600;
}

.notification-panel-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.notification-panel-link {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.notification-panel-link:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.notification-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.notification-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 12px;
  min-height: 420px;
}

.notification-master {
  border-right: 1px solid #e2e8f0;
  padding-right: 12px;
  min-width: 0;
}

.notification-detail {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.notification-detail-title {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.notification-detail-time {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.notification-detail-content {
  margin-top: 12px;
  color: #334155;
  font-size: 14px;
  line-height: 1.7;
  overflow-y: auto;
  max-height: 360px;
  word-break: break-word;
}

.notification-detail-content :deep(p) {
  margin: 0 0 10px;
}

.notification-detail-content :deep(h1),
.notification-detail-content :deep(h2),
.notification-detail-content :deep(h3),
.notification-detail-content :deep(h4) {
  margin: 12px 0 8px;
  color: #0f172a;
}

.notification-detail-content :deep(ul),
.notification-detail-content :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.notification-detail-content :deep(code:not(pre code)) {
  background: #f1f5f9;
  border-radius: 4px;
  padding: 1px 4px;
  font-size: 12px;
}

.notification-detail-content :deep(pre) {
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  overflow-x: auto;
}

.notification-detail-content :deep(blockquote) {
  margin: 10px 0;
  border-left: 3px solid #cbd5e1;
  padding-left: 10px;
  color: #64748b;
}

.notification-detail-empty {
  height: 100%;
}

.notification-tab {
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  color: #334155;
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;
}

.notification-tab.active {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
}

.notification-state {
  min-height: 84px;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-list {
  max-height: 326px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 10px;
  background: #fff;
}

.notification-item {
  border: none;
  background: #fff;
  text-align: left;
  width: 100%;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  border-radius: 8px;
  padding-right: 4px;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.active {
  background: #eff6ff;
}

.notification-item-main {
  min-width: 0;
  flex: 1;
}

.notification-item-title {
  color: #0f172a;
  font-size: 13px;
  font-weight: 500;
}

.notification-item-content {
  margin-top: 4px;
  color: #475569;
  font-size: 12px;
  line-height: 1.5;
  white-space: normal;
  word-break: break-word;
}

.notification-item-time {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 11px;
}

.notification-item.unread .notification-item-title {
  font-weight: 700;
}

.notification-item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
  margin-top: 6px;
}

.notification-footer {
  display: flex;
  justify-content: center;
}

.notification-more {
  border: none;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  padding: 6px 12px;
  cursor: pointer;
}

.notification-more:disabled {
  cursor: not-allowed;
  color: #94a3b8;
}

@media (max-width: 960px) {
  .notification-panel {
    width: min(92vw, 700px);
  }
  .notification-layout {
    grid-template-columns: 1fr;
    min-height: 0;
  }
  .notification-master {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding-right: 0;
    padding-bottom: 10px;
  }
  .notification-detail-content {
    max-height: 280px;
  }
}
</style>
