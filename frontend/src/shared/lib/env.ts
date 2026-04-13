export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  appEnv: import.meta.env.VITE_APP_ENV ?? 'development',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  sfmc: {
    clientId:    import.meta.env.VITE_SFMC_CLIENT_ID    ?? '',
    clientSecret: import.meta.env.VITE_SFMC_CLIENT_SECRET ?? '',
    authBaseUri: import.meta.env.VITE_SFMC_AUTH_BASE_URI ?? '',
    restBaseUri: import.meta.env.VITE_SFMC_REST_BASE_URI ?? '',
    accountId:   import.meta.env.VITE_SFMC_ACCOUNT_ID as string | undefined,
  },
} as const
