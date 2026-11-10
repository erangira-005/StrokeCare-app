// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
// One way to talk to the API: adds the token, refreshes it once when it expires, turns errors into plain sentences,
// and queues a few kinds of entries when the phone is offline so nothing typed is lost.
import { enqueue } from './offline'

export const API_BASE: string = import.meta.env.VITE_API_URL ?? '/api/v1'
const ACCESS = 'sc-access'
const REFRESH = 'sc-refresh'

export class ApiError extends Error {
  status: number
  code: string
  fields: Record<string, string[]>
  constructor(status: number, code: string, message: string, fields: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

/** Set by the app so requests carry the chosen language. */
let currentLocale = 'en'
export function setApiLocale(locale: string) {
  currentLocale = locale
}

let onSessionLost: () => void = () => {}
export function onLogout(cb: () => void) {
  onSessionLost = cb
}

export const tokens = {
  get access() {
    return safeGet(ACCESS)
  },
  get refresh() {
    return safeGet(REFRESH)
  },
  set(access: string, refresh: string) {
    safeSet(ACCESS, access)
    safeSet(REFRESH, refresh)
  },
  clear() {
    safeSet(ACCESS, null)
    safeSet(REFRESH, null)
  },
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* private mode: the session lasts until the tab closes */
  }
}

let refreshing: Promise<boolean> | null = null
async function refreshTokens(): Promise<boolean> {
  const refresh = tokens.refresh
  if (!refresh) return false
  refreshing ??= (async () => {
    try {
      const r = await fetch(`${API_BASE}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (!r.ok) return false
      const data = await r.json()
      tokens.set(data.access, data.refresh ?? refresh) // the server rotates refresh tokens
      return true
    } catch {
      return false
    } finally {
      setTimeout(() => (refreshing = null), 0)
    }
  })()
  return refreshing
}

export interface RequestOptions {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  form?: FormData
  /** Queue this write if the phone is offline (check-ins, readings, doses, home visits). */
  queueable?: boolean
  /** Return the raw Response (for downloads and audio). */
  raw?: boolean
  auth?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }
  return url.toString()
}

export async function request<T = any>(method: string, path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = { 'Accept-Language': currentLocale }
  if (opts.auth !== false && tokens.access) headers.Authorization = `Bearer ${tokens.access}`
  let body: BodyInit | undefined
  if (opts.form) body = opts.form
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, opts.query), { method, headers, body })
  } catch (err) {
    if (opts.queueable && method !== 'GET') {
      enqueue({ method, path, body: opts.body })
      return { queued: true } as T
    }
    throw new ApiError(0, 'offline', 'You seem to be offline. Please try again when you have a connection.')
  }

  if (response.status === 401 && !retried && opts.auth !== false && tokens.refresh) {
    if (await refreshTokens()) return request<T>(method, path, opts, true)
    tokens.clear()
    onSessionLost()
  }
  if (opts.raw && response.ok) return response as unknown as T
  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const e = data?.error ?? {}
    throw new ApiError(response.status, e.code ?? 'error', e.message ?? 'Something went wrong.', e.fields ?? {})
  }
  return data as T
}

export const api = {
  get: <T = any>(path: string, query?: RequestOptions['query']) => request<T>('GET', path, { query }),
  post: <T = any>(path: string, body?: unknown, opts: Omit<RequestOptions, 'body'> = {}) =>
    request<T>('POST', path, { ...opts, body }),
  patch: <T = any>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  del: <T = any>(path: string, body?: unknown, query?: RequestOptions['query']) => request<T>('DELETE', path, { body, query }),
  upload: <T = any>(path: string, form: FormData) => request<T>('POST', path, { form }),
  /** Fetch a protected file (audio, export) as a Blob, with the token. */
  async blob(path: string): Promise<Blob> {
    const r = await request<Response>('GET', path, { raw: true })
    return r.blob()
  },
}

/** First message for a field, or the general message, for showing under a form. */
export function errorText(err: unknown, field?: string): string {
  if (err instanceof ApiError) {
    if (field && err.fields[field]?.length) return err.fields[field][0]
    const first = Object.values(err.fields)[0]
    if (!field && first?.length) return Array.isArray(first) ? String(first[0]) : String(first)
    return err.message
  }
  return 'Something went wrong.'
}
