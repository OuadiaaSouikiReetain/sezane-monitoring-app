import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/shared/lib/env'
import { useSessionStore } from '@/app/store/session-store'

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — inject Bearer token
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useSessionStore.getState()
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401, token refresh, retry
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const { refreshToken, setTokens, logout } = useSessionStore.getState()

      if (!refreshToken) {
        logout()
        window.location.href = '/'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve) => {
          subscribeTokenRefresh((token) => resolve(token))
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`
          } else {
            originalRequest.headers = { Authorization: `Bearer ${token}` }
          }
          return httpClient(originalRequest)
        })
      }

      isRefreshing = true

      try {
        const response = await axios.post<{ access: string }>(
          `${env.apiUrl}/auth/token/refresh/`,
          { refresh: refreshToken }
        )
        const newAccessToken = response.data.access
        setTokens(newAccessToken, refreshToken)
        onRefreshed(newAccessToken)
        isRefreshing = false

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`
        } else {
          originalRequest.headers = { Authorization: `Bearer ${newAccessToken}` }
        }
        return httpClient(originalRequest)
      } catch (_refreshError) {
        isRefreshing = false
        refreshSubscribers = []
        logout()
        window.location.href = '/'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)
