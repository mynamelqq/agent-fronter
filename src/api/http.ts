import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../stores/auth'
import { getAnnoIdForRequest } from './anon'
import { buildApiUrl } from './base-url'

export type ApiResult<T> = {
  code?: number
  message?: string
  msg?: string
  data?: T
}

const REFRESH_URL = '/api/user/refresh'
let refreshPromise: Promise<string> | null = null

function buildApiHeaders(init: RequestInit = {}) {
  const token = getAccessToken()
  const headers = new Headers(init.headers || {})
  if (!headers.has('Content-Type') && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  } else {
    // 未登录：自动携带 annoId，后端按匿名用户处理
    const annoId = getAnnoIdForRequest()
    if (annoId && !headers.has('Anno-Id')) {
      headers.set('Anno-Id', annoId)
    }
  }
  return headers
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function isRefreshRequest(input: RequestInfo | URL): boolean {
  return resolveRequestUrl(input).includes(REFRESH_URL)
}

function extractAccessToken(payload: unknown): string {
  const obj = payload as Record<string, unknown> | null | undefined
  const direct = obj?.accessToken
  if (typeof direct === 'string' && direct.trim()) return direct.trim()

  const data = obj?.data
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (data && typeof data === 'object') {
    const nested = (data as Record<string, unknown>).accessToken
    if (typeof nested === 'string' && nested.trim()) return nested.trim()
  }
  return ''
}

async function doRefreshToken(refreshToken: string): Promise<string> {
  const refreshUrl = buildApiUrl(REFRESH_URL)
  const resp = await fetch(refreshUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  if (!resp.ok) {
    throw new Error(`refresh failed: ${resp.status}`)
  }

  const contentType = resp.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const json = (await resp.json()) as unknown
    const token = extractAccessToken(json)
    if (token) return token
  } else {
    const text = (await resp.text()).trim()
    if (text) return text
  }

  throw new Error('refresh failed: missing access token')
}

async function ensureRefreshedAccessToken(refreshToken: string): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = doRefreshToken(refreshToken)
      .then((newAccessToken) => {
        setTokens(newAccessToken, refreshToken)
        return newAccessToken
      })
      .catch((err) => {
        clearTokens()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        throw err
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function requestWithAutoRefresh(input: RequestInfo | URL, init: RequestInit = {}) {
  const firstHeaders = buildApiHeaders(init)
  const firstResp = await fetch(input, { ...init, headers: firstHeaders })

  if (firstResp.status !== 401 || isRefreshRequest(input)) {
    return firstResp
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) return firstResp

  try {
    await ensureRefreshedAccessToken(refreshToken)
  } catch {
    return firstResp
  }

  const retryHeaders = buildApiHeaders(init)
  return fetch(input, { ...init, headers: retryHeaders })
}

export async function apiFetch<T>(input: RequestInfo | URL, init: RequestInit = {}) {
  const resolvedInput =
    typeof input === 'string' ? buildApiUrl(input) : input instanceof URL ? new URL(buildApiUrl(input.toString())) : input
  const res = await requestWithAutoRefresh(resolvedInput, init)
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const json = (await res.json()) as ApiResult<T>
    return { ok: res.ok, status: res.status, json }
  }
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

// 流式接口需要保留原始 Response.body，不能在这里消费响应体
export async function apiFetchRaw(input: RequestInfo | URL, init: RequestInit = {}) {
  const resolvedInput =
    typeof input === 'string' ? buildApiUrl(input) : input instanceof URL ? new URL(buildApiUrl(input.toString())) : input
  return requestWithAutoRefresh(resolvedInput, init)
}
