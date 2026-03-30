import { computed, ref } from 'vue'
import SockJS from 'sockjs-client'
import * as StompBrowser from 'stompjs/lib/stomp.js'
import { ElNotification } from 'element-plus'
import { getAccessToken, isLoggedIn } from './auth'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
  type NotificationStatus
} from '../api/notifications'
import { buildWsUrl } from '../api/base-url'

const PAGE_SIZE = 10

type PushPayload = {
  title?: string
  content?: string
  type?: string
  link?: string
  unreadCount?: number
}

const items = ref<NotificationItem[]>([])
const unreadCount = ref(0)
const status = ref<NotificationStatus>('all')
const loading = ref(false)
const loadingMore = ref(false)
const wsConnected = ref(false)

const total = ref(0)
const currentPage = ref(1)
const lastPageSize = ref(0)

const hasMore = computed(() => {
  if (total.value > 0) return items.value.length < total.value
  return lastPageSize.value >= PAGE_SIZE
})

let activeConsumers = 0
let reconnectTimer: number | null = null
let refreshTimer: number | null = null
let stompClient: any = null
let sock: any = null
let manualDisconnect = false
const stompApi: any =
  (StompBrowser as any).Stomp ??
  (StompBrowser as any).default?.Stomp ??
  (StompBrowser as any).default ??
  StompBrowser

function clearReconnectTimer() {
  if (reconnectTimer != null) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function clearRefreshTimer() {
  if (refreshTimer != null) {
    window.clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

function mergeById(base: NotificationItem[], incoming: NotificationItem[]) {
  const map = new Map<string, NotificationItem>()
  for (const item of base) map.set(item.id, item)
  for (const item of incoming) {
    const prev = map.get(item.id)
    map.set(item.id, prev ? { ...prev, ...item } : item)
  }
  return Array.from(map.values())
}

function openNotificationLink(link?: string) {
  if (!link) return
  if (/^https?:\/\//i.test(link)) {
    window.open(link, '_blank', 'noopener')
    return
  }
  if (link.startsWith('/')) {
    window.location.href = link
  }
}

async function loadPage(page: number, reset = false) {
  if (!isLoggedIn()) {
    loading.value = false
    loadingMore.value = false
    return
  }

  if (reset) loading.value = true
  else loadingMore.value = true

  try {
    const res = await fetchNotifications(status.value, page, PAGE_SIZE)
    if (reset) {
      items.value = res.records
    } else {
      items.value = mergeById(items.value, res.records)
    }
    total.value = res.total
    currentPage.value = page
    lastPageSize.value = res.records.length
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function refreshUnread() {
  if (!isLoggedIn()) {
    unreadCount.value = 0
    return
  }
  try {
    unreadCount.value = await fetchUnreadCount()
  } catch {
    unreadCount.value = 0
  }
}

function scheduleRefreshFromPush() {
  clearRefreshTimer()
  refreshTimer = window.setTimeout(async () => {
    refreshTimer = null
    await Promise.allSettled([refreshUnread(), loadPage(1, true)])
  }, 450)
}

function handlePush(payload: PushPayload) {
  if (!isLoggedIn()) return

  if (typeof payload.unreadCount === 'number' && Number.isFinite(payload.unreadCount)) {
    unreadCount.value = Math.max(0, Math.floor(payload.unreadCount))
  } else {
    void refreshUnread()
  }

  const title = payload.title || '系统通知'
  const message = payload.content || payload.title || '您有新的通知'
  ElNotification({
    title,
    message,
    type: 'info',
    duration: 4500,
    onClick: () => openNotificationLink(payload.link)
  })

  scheduleRefreshFromPush()
}

function scheduleReconnect() {
  if (activeConsumers <= 0 || manualDisconnect || !isLoggedIn() || !getAccessToken()) return
  clearReconnectTimer()
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    connectWebSocket()
  }, 3000)
}

function disconnectWebSocket() {
  manualDisconnect = true
  clearReconnectTimer()
  wsConnected.value = false
  try {
    if (stompClient?.connected) {
      stompClient.disconnect(() => {})
    }
  } catch {}
  try {
    sock?.close?.()
  } catch {}
  stompClient = null
  sock = null
}

function connectWebSocket() {
  const accessToken = getAccessToken()
  if (!isLoggedIn() || !accessToken) return
  if (stompClient?.connected) return

  manualDisconnect = false
  clearReconnectTimer()

  sock = new SockJS(buildWsUrl('/api/ws/notification', 'VITE_NOTIFICATION_WS_URL'))
  if (!stompApi || typeof stompApi.over !== 'function') {
    wsConnected.value = false
    return
  }
  stompClient = stompApi.over(sock)
  stompClient.debug = () => {}

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`
  }

  stompClient.connect(
    headers,
    () => {
      wsConnected.value = true
      stompClient.subscribe('/api/user/queue/notification', (msg: any) => {
        try {
          const data = JSON.parse(String(msg?.body ?? '{}')) as PushPayload
          handlePush(data)
        } catch {}
      })
    },
    () => {
      wsConnected.value = false
      scheduleReconnect()
    }
  )

  if (sock && typeof sock.onclose === 'function') {
    const prev = sock.onclose
    sock.onclose = (...args: any[]) => {
      try {
        prev.apply(sock, args)
      } catch {}
      wsConnected.value = false
      if (!manualDisconnect) scheduleReconnect()
    }
  }
}

function handleAuthChanged() {
  if (!isLoggedIn()) {
    disconnectWebSocket()
    items.value = []
    unreadCount.value = 0
    return
  }

  void Promise.allSettled([refreshUnread(), loadPage(1, true)])
  connectWebSocket()
}

async function setStatus(next: NotificationStatus) {
  if (!isLoggedIn()) return
  if (status.value === next) return
  status.value = next
  await loadPage(1, true)
}

async function refreshList() {
  if (!isLoggedIn()) return
  await Promise.allSettled([refreshUnread(), loadPage(1, true)])
}

async function loadMore() {
  if (!isLoggedIn()) return
  if (loadingMore.value || loading.value || !hasMore.value) return
  await loadPage(currentPage.value + 1, false)
}

async function readOne(id: string) {
  if (!isLoggedIn()) return
  await markNotificationRead(id)
  let changed = false
  for (const item of items.value) {
    if (item.id === id && !item.read) {
      item.read = true
      changed = true
    }
  }
  if (changed) unreadCount.value = Math.max(0, unreadCount.value - 1)
  if (status.value === 'unread') {
    items.value = items.value.filter((it) => !it.read)
  }
}

async function readAll() {
  if (!isLoggedIn()) return
  await markAllNotificationsRead()
  unreadCount.value = 0
  if (status.value === 'unread') {
    items.value = []
    total.value = 0
    currentPage.value = 1
    lastPageSize.value = 0
  } else {
    items.value = items.value.map((it) => ({ ...it, read: true }))
  }
}

function init() {
  activeConsumers += 1
  if (activeConsumers > 1) return

  window.addEventListener('auth:updated', handleAuthChanged)
  if (!isLoggedIn()) {
    items.value = []
    unreadCount.value = 0
    return
  }
  void Promise.allSettled([refreshUnread(), loadPage(1, true)])
  connectWebSocket()
}

function dispose() {
  activeConsumers = Math.max(0, activeConsumers - 1)
  if (activeConsumers > 0) return
  clearRefreshTimer()
  window.removeEventListener('auth:updated', handleAuthChanged)
  disconnectWebSocket()
}

export function useNotificationStore() {
  return {
    items,
    unreadCount,
    status,
    loading,
    loadingMore,
    wsConnected,
    hasMore,
    init,
    dispose,
    setStatus,
    refreshList,
    loadMore,
    readOne,
    readAll
  }
}
