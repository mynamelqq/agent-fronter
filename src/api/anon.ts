/**
 * 匿名用户识别：未登录游客通过本地生成的 anonId 标识
 * 约定：
 * - 前端本地生成并缓存 anonId；
 * - 调用 GET /api/anon/identify 时，必须通过 Header(Anno-Id) 或参数(annoId) 传给后端；
 * - 之后所有请求统一在 Header 中携带 Anno-Id。
 */
import { generateFingerprint } from '../utils/fingerprint'

export interface AnonymousUser {
  anonId: string
  dailyTokenLimit: number
  totalTokensUsed: number
  createdAt: string
  lastActiveAt: string
  ip?: string
}

const IDENTIFY_URL = '/api/anon/identify'
const ANNO_ID_STORAGE_KEY = 'chatui_anno_id_v1'

let identifyPromise: Promise<AnonymousUser> | null = null

function saveAnnoIdToStorage(anonId: string | undefined | null) {
  if (!anonId) return
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(ANNO_ID_STORAGE_KEY, String(anonId))
    }
  } catch {
    // ignore
  }
}

export function getStoredAnnoId(): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const v = window.localStorage.getItem(ANNO_ID_STORAGE_KEY)
    return v && v.trim() ? v.trim() : null
  } catch {
    return null
  }
}

function generateLocalAnnoId(): string {
  // 优先使用 crypto.randomUUID，降级为时间 + 随机数
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (crypto as any).randomUUID()
    }
  } catch {
    // ignore
  }
  const rand = Math.random().toString(36).slice(2, 10)
  const ts = Date.now().toString(36)
  return `anon-${ts}-${rand}`
}

/**
 * 调用服务端 /api/anon/identify，基于当前 anonId 获取或创建匿名用户。
 * 要求：调用前已在本地生成并缓存 anonId。
 */
export async function identifyAnon(fingerprintHash?: string): Promise<AnonymousUser> {
  // 确保本地已有 anonId，没有则生成一个
  let anonId = getStoredAnnoId()
  if (!anonId) {
    anonId = generateLocalAnnoId()
    saveAnnoIdToStorage(anonId)
  }

  const hash = fingerprintHash ?? generateFingerprint()
  const url = `${IDENTIFY_URL}?annoId=${encodeURIComponent(anonId)}`

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Fingerprint-Hash': hash,
      'Anno-Id': anonId
    }
  })
  if (!res.ok) {
    throw new Error(`anon identify failed: ${res.status}`)
  }
  const data = (await res.json()) as Record<string, unknown>
  const serverAnonId = (data.anonId ?? data.annoId ?? data.anon_id ?? data.anno_id) as string | undefined
  const finalAnonId = serverAnonId && String(serverAnonId).trim() ? String(serverAnonId).trim() : anonId

  // 将 anonId 缓存到本地，供后续请求通过 Header 携带
  saveAnnoIdToStorage(finalAnonId)

  return {
    anonId: finalAnonId,
    dailyTokenLimit: Number(data.dailyTokenLimit) || 0,
    totalTokensUsed: Number(data.totalTokensUsed) || 0,
    createdAt: String(data.createdAt ?? ''),
    lastActiveAt: String(data.lastActiveAt ?? ''),
    ip: data.ip != null ? String(data.ip) : undefined
  }
}

/**
 * 确保匿名用户已识别（仅未登录时需要）
 * 复用同一 promise，避免重复请求
 */
export async function ensureAnonIdentified(): Promise<AnonymousUser | null> {
  // 如果本地已经有 anonId，则认为已完成过匿名识别，无需再次请求后端
  const stored = getStoredAnnoId()
  if (stored) {
    return null
  }

  if (identifyPromise) return identifyPromise
  identifyPromise = identifyAnon()
  try {
    const user = await identifyPromise
    saveAnnoIdToStorage(user?.anonId)
    return user
  } catch (e) {
    identifyPromise = null
    throw e
  }
}

/**
 * 获取用于请求头的 annoId：
 * 1. 优先从本地缓存读取；
 * 2. 若无缓存，则在本地生成一个并写入缓存；
 * 3. 失败时返回 null，不阻断正常请求。
 *
 * 注意：此函数本身不强依赖后端 /identify 接口，便于在其他接口中直接使用 annoId。
 */
export function getAnnoIdForRequest(): string | null {
  const stored = getStoredAnnoId()
  if (stored) return stored
  const anonId = generateLocalAnnoId()
  saveAnnoIdToStorage(anonId)
  return anonId
}
