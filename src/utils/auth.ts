import { clearTokens, getAccessToken, getRefreshToken, isLoggedIn as coreIsLoggedIn } from '../stores/auth'

export { getAccessToken, getRefreshToken }

export function isLoggedIn(): boolean {
  return coreIsLoggedIn()
}

export function logout(): void {
  clearTokens()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

