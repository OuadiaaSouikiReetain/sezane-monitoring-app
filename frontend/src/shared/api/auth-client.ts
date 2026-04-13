import { httpClient } from './http-client'

interface LoginPayload {
  username: string
  password: string
}
interface TokenPair {
  access: string
  refresh: string
}
interface UserProfile {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
}

export const authApi = {
  login: (payload: LoginPayload) =>
    httpClient.post<TokenPair>('/auth/token/', payload),
  refresh: (refresh: string) =>
    httpClient.post<{ access: string }>('/auth/token/refresh/', { refresh }),
  verify: (token: string) =>
    httpClient.post('/auth/token/verify/', { token }),
  me: () =>
    httpClient.get<UserProfile>('/auth/me/'),
  logout: () =>
    httpClient.post('/auth/logout/'),
}
