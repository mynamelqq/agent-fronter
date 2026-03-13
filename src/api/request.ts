import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../stores/auth'
import { getAnnoIdForRequest } from './anon'

// 刷新接口路径与请求体类型
const REFRESH_URL = '/api/user/refresh'

export interface RefreshResponse {
  accessToken: string
  data?: string | { accessToken?: string }
}

type PendingRequest = {
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
  config: AxiosRequestConfig
}

let isRefreshing = false
let refreshPromise: Promise<string> | null = null
const pendingQueue: PendingRequest[] = []

function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: '/api',
    timeout: 30000
  })

  // 请求拦截器：自动携带 accessToken
  instance.interceptors.request.use(
    (config) => {
      const token = getAccessToken()
      config.headers = config.headers || {}
      if (token) {
        ;(config.headers as any).Authorization = `Bearer ${token}`
      } else {
        const annoId = getAnnoIdForRequest()
        if (annoId && !(config.headers as any)['Anno-Id']) {
          ;(config.headers as any)['Anno-Id'] = annoId
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // 响应拦截器：处理 401 & 刷新 token
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalConfig = error.config as AxiosRequestConfig & { _retry?: boolean }

      // 若没有响应或配置，直接抛出
      if (!error.response || !originalConfig) {
        return Promise.reject(error)
      }

      const status = error.response.status
      const isRefreshRequest = originalConfig.url?.includes(REFRESH_URL)

      // 非 401 或 刷新接口本身的 401，直接抛出
      if (status !== 401 || isRefreshRequest) {
        return Promise.reject(error)
      }

      // 避免同一个请求重复重试
      if (originalConfig._retry) {
        return Promise.reject(error)
      }
      originalConfig._retry = true

      // 如果当前没有在刷新，则发起刷新
      if (!isRefreshing) {
        isRefreshing = true
        const currentRefreshToken = getRefreshToken()

        if (!currentRefreshToken) {
          handleRefreshFailed()
          return Promise.reject(error)
        }

        refreshPromise = doRefreshToken(currentRefreshToken)
          .then((newAccessToken) => {
            // 刷新成功：更新本地 accessToken
            setTokens(newAccessToken, currentRefreshToken)
            // 依次重试队列中的请求
            pendingQueue.forEach(({ resolve, config }) => {
              resolve(instance(config))
            })
            pendingQueue.length = 0
            return newAccessToken
          })
          .catch((refreshErr) => {
            // 刷新失败：清理队列并登出
            pendingQueue.forEach(({ reject }) => reject(refreshErr))
            pendingQueue.length = 0
            handleRefreshFailed()
            throw refreshErr
          })
          .finally(() => {
            isRefreshing = false
            refreshPromise = null
          })
      }

      // 刷新进行中：将当前请求放入队列，等待刷新结果
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, config: originalConfig })
      })
    }
  )

  return instance
}

async function doRefreshToken(refreshToken: string): Promise<string> {
  const resp = await axios.post<RefreshResponse>(REFRESH_URL, { refreshToken })
  const accessToken =
    (typeof resp.data?.accessToken === 'string' && resp.data.accessToken) ||
    (typeof resp.data?.data === 'string' && resp.data.data) ||
    (typeof resp.data?.data === 'object' &&
    typeof (resp.data.data as { accessToken?: string })?.accessToken === 'string'
      ? (resp.data.data as { accessToken?: string }).accessToken
      : '')

  if (!accessToken) {
    throw new Error('刷新 token 失败：未返回 accessToken')
  }
  return accessToken
}

function handleRefreshFailed() {
  clearTokens()
  // 统一跳转登录页
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// 单例 axios 实例
export const request: AxiosInstance = createAxiosInstance()

// 方便直接使用的封装方法
export function get<T = any>(url: string, config?: AxiosRequestConfig) {
  return request.get<T>(url, config)
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
  return request.post<T>(url, data, config)
}

