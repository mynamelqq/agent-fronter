import { get, post } from './request'

export type NotificationStatus = 'all' | 'unread' | 'read'

export interface NotificationItem {
  id: string
  title: string
  content: string
  type: string
  link?: string
  read: boolean
  createdAt?: string
}

export interface NotificationPage {
  records: NotificationItem[]
  total: number
  current: number
  size: number
}

function unwrapData<T>(resp: any): T {
  const root = resp?.data
  if (root && typeof root === 'object' && 'data' in root) {
    return root.data as T
  }
  return root as T
}

function toIsoString(raw: unknown): string | undefined {
  if (raw == null || raw === '') return undefined
  if (typeof raw === 'number') {
    const ms = raw < 1e12 ? Math.round(raw * 1000) : Math.round(raw)
    return new Date(ms).toISOString()
  }
  const text = String(raw).trim()
  if (!text) return undefined
  const dt = new Date(text)
  if (!Number.isNaN(dt.getTime())) return dt.toISOString()
  return text
}

function normalizeItem(raw: any): NotificationItem {
  const statusRaw = String(raw?.status ?? '').toLowerCase()
  const read =
    Boolean(raw?.read) ||
    Boolean(raw?.isRead) ||
    statusRaw === 'read' ||
    statusRaw === '已读' ||
    statusRaw === '1'

  return {
    id: String(raw?.id ?? ''),
    title: String(raw?.title ?? ''),
    content: String(raw?.content ?? ''),
    type: String(raw?.type ?? ''),
    link: raw?.link ? String(raw.link) : undefined,
    read,
    createdAt: toIsoString(raw?.createdAt ?? raw?.created_at ?? raw?.createTime ?? raw?.time)
  }
}

export async function fetchNotifications(status: NotificationStatus, page: number, size: number): Promise<NotificationPage> {
  const resp = await get<any>('/notifications', { params: { status, page, size } })
  const data = unwrapData<any>(resp)
  const recordsRaw = Array.isArray(data?.records) ? data.records : []
  return {
    records: recordsRaw.map(normalizeItem).filter((it) => it.id),
    total: Number(data?.total ?? recordsRaw.length ?? 0),
    current: Number(data?.current ?? page),
    size: Number(data?.size ?? size)
  }
}

export async function markNotificationRead(id: string | number): Promise<void> {
  await post(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await post('/notifications/read-all')
}

export async function fetchUnreadCount(): Promise<number> {
  const resp = await get<any>('/notifications/unread-count')
  const data = unwrapData<any>(resp)
  const count = Number(data)
  return Number.isFinite(count) ? count : 0
}
