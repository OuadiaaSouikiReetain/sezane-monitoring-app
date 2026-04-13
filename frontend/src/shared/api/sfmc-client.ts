/**
 * SFMC REST API client — handles OAuth2 client_credentials auth with
 * in-memory token caching and automatic pagination.
 *
 * SECURITY NOTE: VITE_ env vars are bundled into browser JS and are visible
 * to anyone with access to the app. For production environments, proxy SFMC
 * calls through your backend (Django) to keep client_secret server-side.
 *
 * In development, Vite proxies /sfmc-auth and /sfmc-rest to the real SFMC
 * endpoints (configured in vite.config.js) to avoid CORS issues.
 */

import axios, { isAxiosError } from 'axios'
import { z } from 'zod'
import { env } from '@/shared/lib/env'

// ─── Custom errors ────────────────────────────────────────────────────────────

export class SfmcAuthError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'SfmcAuthError'
  }
}

export class SfmcApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'SfmcApiError'
  }
}

// ─── Token cache ──────────────────────────────────────────────────────────────

interface TokenCache {
  token: string
  expiresAt: number // ms epoch
}

let _cache: TokenCache | null = null

const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type:   z.string(),
  expires_in:   z.number(),
})

// In dev, Vite proxies /sfmc-auth → VITE_SFMC_AUTH_BASE_URI (avoids CORS).
// In prod, the real URI is used directly (requires proper CORS or a backend proxy).
function authBase(): string {
  return env.isDev ? '/sfmc-auth' : env.sfmc.authBaseUri
}

function restBase(): string {
  return env.isDev ? '/sfmc-rest' : env.sfmc.restBaseUri
}

// ─── Authentication ───────────────────────────────────────────────────────────

export async function getSfmcToken(): Promise<string> {
  if (_cache && Date.now() < _cache.expiresAt) return _cache.token

  if (!env.sfmc.clientId || !env.sfmc.clientSecret || !env.sfmc.authBaseUri) {
    throw new SfmcAuthError(
      'SFMC credentials are not configured. Set VITE_SFMC_CLIENT_ID, ' +
      'VITE_SFMC_CLIENT_SECRET, and VITE_SFMC_AUTH_BASE_URI in your .env file.'
    )
  }

  try {
    const response = await axios.post(
      `${authBase()}/v2/token`,
      {
        grant_type:    'client_credentials',
        client_id:     env.sfmc.clientId,
        client_secret: env.sfmc.clientSecret,
        ...(env.sfmc.accountId ? { account_id: env.sfmc.accountId } : {}),
      },
      { headers: { 'Content-Type': 'application/json' } }
    )

    const { access_token, expires_in } = TokenResponseSchema.parse(response.data)

    // Subtract 60 s buffer to avoid using an about-to-expire token
    _cache = {
      token:     access_token,
      expiresAt: Date.now() + (expires_in - 60) * 1000,
    }
    return _cache.token
  } catch (err) {
    _cache = null
    if (isAxiosError(err)) {
      const msg = (err.response?.data as { message?: string })?.message ?? err.message
      throw new SfmcAuthError(`SFMC authentication failed: ${msg}`, err)
    }
    throw new SfmcAuthError('SFMC authentication failed', err)
  }
}

/** Force re-authentication on the next request (e.g. after a 401). */
export function invalidateSfmcToken(): void {
  _cache = null
}

// ─── Authenticated GET ────────────────────────────────────────────────────────

export async function sfmcGet<T>(
  path: string,
  params?: Record<string, unknown>
): Promise<T> {
  if (!env.sfmc.restBaseUri) {
    throw new SfmcAuthError(
      'SFMC REST Base URI is not configured. Set VITE_SFMC_REST_BASE_URI in your .env file.'
    )
  }

  const token = await getSfmcToken()

  try {
    const response = await axios.get<T>(`${restBase()}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
      timeout: 30_000,
    })
    return response.data
  } catch (err) {
    if (isAxiosError(err)) {
      if (err.response?.status === 401) invalidateSfmcToken()
      const msg = (err.response?.data as { message?: string })?.message ?? err.message
      throw new SfmcApiError(
        `SFMC API error on ${path}: ${msg}`,
        err.response?.status,
        err
      )
    }
    throw new SfmcApiError(`SFMC request failed on ${path}`, undefined, err)
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface SfmcPagedResponse<T> {
  page:     number
  pageSize: number
  count:    number
  items:    T[]
}

/**
 * Fetches all pages from a paginated SFMC endpoint.
 * SFMC uses $page / $pageSize query params and returns { page, pageSize, count, items }.
 */
export async function sfmcGetAllPages<T>(
  path:     string,
  pageSize = 50
): Promise<T[]> {
  const all: T[] = []
  let page = 1

  do {
    const data = await sfmcGet<SfmcPagedResponse<T>>(path, {
      $page:     page,
      $pageSize: pageSize,
    })
    all.push(...data.items)
    if (all.length >= data.count) break
    page++
  } while (true)   // eslint-disable-line no-constant-condition

  return all
}
