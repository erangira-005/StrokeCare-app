// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api, ApiError, errorText, tokens } from '../src/api/client'
import { clearQueue, flush, pendingCount } from '../src/api/offline'

const json = (status: number, body: unknown) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  localStorage.clear()
  clearQueue()
})
afterEach(() => vi.restoreAllMocks())

describe('api client', () => {
  it('refreshes an expired token once, stores the rotated pair, and retries', async () => {
    tokens.set('old-access', 'old-refresh')
    const calls: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const u = String(url)
      calls.push(`${init?.method} ${u.replace(window.location.origin, '')} ${(init?.headers as any)?.Authorization ?? ''}`)
      if (u.endsWith('/auth/refresh/')) return json(200, { access: 'new-access', refresh: 'new-refresh' })
      if ((init?.headers as any)?.Authorization === 'Bearer old-access') return json(401, { error: { code: 'token_not_valid', message: 'expired' } })
      return json(200, { ok: true })
    })
    expect(await api.get('/me/')).toEqual({ ok: true })
    expect(tokens.access).toBe('new-access')
    expect(tokens.refresh).toBe('new-refresh')
    expect(calls).toHaveLength(3)
  })

  it('turns the API error shape into a readable message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(400, { error: { code: 'validation_error', message: 'Some details need fixing.', fields: { systolic: ['Please check this number.'] } } }),
    )
    const err = await api.post('/patients/me/readings/', {}).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(errorText(err)).toBe('Please check this number.')
    expect(errorText(err, 'systolic')).toBe('Please check this number.')
  })

  it('queues a queueable write when the network is down, and not others', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await api.post('/patients/me/checkins/', { answers: [] }, { queueable: true })).toEqual({ queued: true })
    expect(pendingCount.value).toBe(1)
    await expect(api.post('/patients/me/messages/', { body: 'x' })).rejects.toBeInstanceOf(ApiError)
    expect(pendingCount.value).toBe(1)
  })
})

describe('offline outbox', () => {
  it('sends in order, keeps entries on a network failure, drops ones the server rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))
    for (const n of [1, 2, 3]) await api.post(`/x/${n}/`, { n }, { queueable: true })
    expect(pendingCount.value).toBe(3)

    const seen: string[] = []
    const result = await flush(async (item) => {
      seen.push(item.path)
      if (item.path === '/x/2/') return json(400, {})
      if (item.path === '/x/3/') throw new TypeError('offline again')
      return json(201, {})
    })
    expect(seen).toEqual(['/x/1/', '/x/2/', '/x/3/'])
    expect(result).toEqual({ sent: 1, dropped: 1 })
    expect(pendingCount.value).toBe(1) // the third waits for the next connection
  })
})
