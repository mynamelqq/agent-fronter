import { getAccessToken } from '../stores/auth'
import { getAnnoIdForRequest } from './anon'

export type ApiResult<T> = {
  code?: number
  message?: string
  msg?: string
  data?: T
}

function buildApiHeaders(init: RequestInit = {}) {
  const token = getAccessToken()
  const headers = new Headers(init.headers || {})
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  } else {
    // 未登录：自动携带 annoId，后端按匿名用户处理
    const annoId = getAnnoIdForRequest()
    if (annoId && !headers.has('Anno-Id')) {
      headers.set('Anno-Id', annoId)
    }
  }
  return headers
}

export async function apiFetch<T>(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = buildApiHeaders(init)

  const res = await fetch(input, { ...init, headers })
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
  const headers = buildApiHeaders(init)
  const res = await fetch(input, { ...init, headers })
  return res
}
