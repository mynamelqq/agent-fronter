const env = (import.meta as any).env ?? {}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  const base = env.VITE_API_BASE_URL
  return typeof base === 'string' && base.trim() ? trimTrailingSlash(base.trim()) : ''
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl()
  if (!base) return path
  if (/^https?:\/\//i.test(path)) return path
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}

export function buildWsUrl(path: string, explicitEnvKey?: string): string {
  const explicit = explicitEnvKey ? env[explicitEnvKey] : ''
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim()

  const apiBase = getApiBaseUrl()
  if (apiBase) {
    return buildApiUrl(path).replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:')
  }

  const protocol =
    typeof location !== 'undefined' && location.protocol === 'https:'
      ? 'wss:'
      : 'ws:'
  const host = typeof location !== 'undefined' ? location.host : '127.0.0.1:5174'
  return `${protocol}//${host}${path}`
}

export function buildSockJsUrl(path: string, explicitEnvKey?: string): string {
  const explicit = explicitEnvKey ? env[explicitEnvKey] : ''
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim().replace(/^ws:/i, 'http:').replace(/^wss:/i, 'https:')
  }

  const apiBase = getApiBaseUrl()
  if (apiBase) {
    return buildApiUrl(path)
  }

  const protocol =
    typeof location !== 'undefined' && location.protocol === 'https:'
      ? 'https:'
      : 'http:'
  const host = typeof location !== 'undefined' ? location.host : '127.0.0.1:5174'
  return `${protocol}//${host}${path}`
}
