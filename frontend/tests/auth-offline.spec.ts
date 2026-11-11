// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
// Opening the app with no signal must never sign the person out, and with the optional saved copy it opens offline.
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { tokens } from '../src/api/client'
import { setCopyEnabled, setCopyOwner, saveCopy } from '../src/api/copy'
import { useAuth } from '../src/stores/auth'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const ME = { user: { id: 'u1', role: 'survivor', display_name: 'Demo', preferred_language: 'en', timezone: 'Africa/Kigali', email: 'd@example.org' }, consents: {} }

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  setCopyEnabled(false)
  setCopyOwner(null)
  tokens.set('access-1', 'refresh-1')
})
afterEach(() => vi.restoreAllMocks())

describe('starting the app without a connection', () => {
  it('keeps the person signed in when the network is down', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const auth = useAuth()
    await auth.load()
    expect(auth.ready).toBe(true)
    expect(tokens.refresh).toBe('refresh-1') // still signed in on the phone, ready for when the signal returns
  })

  it('keeps the person signed in when the server is briefly down', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(503, { error: { code: 'unavailable', message: 'Try again soon.' } }))
    await useAuth().load()
    expect(tokens.refresh).toBe('refresh-1')
  })

  it('does end the session when the server says the login is no longer valid', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      String(url).endsWith('/auth/refresh/') ? json(401, { error: { code: 'token_not_valid', message: 'x' } }) : json(401, { error: { code: 'token_not_valid', message: 'x' } }),
    )
    const auth = useAuth()
    await auth.load()
    expect(tokens.refresh).toBeNull()
    expect(auth.signedIn).toBe(false)
  })

  it('opens from the saved copy when the person turned it on', async () => {
    setCopyEnabled(true)
    saveCopy('/me/', undefined, ME)
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const auth = useAuth()
    await auth.load()
    expect(auth.signedIn).toBe(true)
    expect(auth.user?.display_name).toBe('Demo')
  })

  it('without the saved copy, nothing about the person is available offline', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const auth = useAuth()
    await auth.load()
    expect(auth.signedIn).toBe(false)
    expect(Object.keys(localStorage).filter((k) => k.startsWith('sc-copy:'))).toHaveLength(0)
  })

  it('signing out removes the saved copy, including who was signed in', async () => {
    setCopyEnabled(true)
    saveCopy('/me/', undefined, ME)
    const auth = useAuth()
    auth.forget()
    expect(Object.keys(localStorage).filter((k) => k.startsWith('sc-copy:'))).toHaveLength(0)
  })
})
