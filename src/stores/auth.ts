import { ref, type Ref } from 'vue'

const ACCESS_TOKEN_KEY = 'chatui_access_token_v1'
const REFRESH_TOKEN_KEY = 'chatui_refresh_token_v1'
const USER_KEY = 'chatui_user_v1'

export interface UserVO {
  username: string
  id: bigint | string
  avatar_url?: string
  nickname?: string
  last_login_at?: string
  created_at?: string
}

const MAX_SAFE_INTEGER = 2 ** 53 - 1

/** 将用户 id 规范为字符串；若为 number 且超过安全整数则已精度丢失，需后端改为返回 string */
function normalizeUserId(id: unknown): string {
  if (id === undefined || id === null) return ''
  if (typeof id === 'string') return id
  if (typeof id === 'number') {
    if (id > MAX_SAFE_INTEGER || id < -MAX_SAFE_INTEGER) {
      if (import.meta.env?.DEV) {
        console.warn(
          '[auth] 用户 id 超过 JS 安全整数范围，已精度丢失。请后端将 bigint 以字符串返回，例如 "id": "3400803050385984754"'
        )
      }
    }
    return String(id)
  }
  return String(id)
}

function readStoredUser(): UserVO | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const u = JSON.parse(raw) as UserVO
    return { ...u, id: normalizeUserId(u.id) }
  } catch {
    return null
  }
}

/** 当前用户（登录后从本地缓存恢复，供界面绑定） */
export const currentUser: Ref<UserVO | null> = ref<UserVO | null>(null)

function hydrateUser() {
  const u = readStoredUser()
  currentUser.value = u
}
hydrateUser()

export function getAccessToken(): string {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? ''
}

export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? ''
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
  try {
    window.dispatchEvent(new CustomEvent('auth:updated'))
  } catch {}
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    currentUser.value = null
    window.dispatchEvent(new CustomEvent('auth:updated'))
  } catch {}
}

export function isLoggedIn() {
  return !!getAccessToken()
}

export function getUser(): UserVO | null {
  if (currentUser.value) return currentUser.value
  const u = readStoredUser()
  if (u) {
    currentUser.value = u
    return u
  }
  return null
}

/** 登录/刷新后写入用户信息并缓存到本地；id 会规范为 string 避免 bigint 精度问题 */
export function setUser(user: UserVO) {
  try {
    const normalized: UserVO = { ...user, id: normalizeUserId(user.id) }
    localStorage.setItem(USER_KEY, JSON.stringify(normalized))
    currentUser.value = normalized
    window.dispatchEvent(new CustomEvent('auth:updated'))
  } catch {}
}

/** 兼容旧代码：保留 getToken/clearToken，但内部走新双 token 逻辑 */
export function getToken(): string {
  const accessToken = getAccessToken()
  return accessToken ? `Bearer ${accessToken}` : ''
}

export function clearToken() {
  clearTokens()
}
