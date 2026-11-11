// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
// The optional "keep my plan on this phone" copy. Phones are often shared, so the rules are strict:
// off by default, only the person's own plan-type data, never health readings or messages, one owner, and wiped on sign-out.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api, ApiError } from '../src/api/client'
import { copyEnabled, readCopy, saveCopy, setCopyEnabled, setCopyOwner, showingCopy, wipeCopies } from '../src/api/copy'

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
const copies = () => Object.keys(localStorage).filter((k) => k.startsWith('sc-copy:'))

beforeEach(() => {
  localStorage.clear()
  setCopyEnabled(false)
  setCopyOwner('person-a')
  showingCopy.value = false
})
afterEach(() => vi.restoreAllMocks())

describe('offline copy', () => {
  it('is off by default and keeps nothing', async () => {
    expect(copyEnabled.value).toBe(false)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ tasks: [1] }))
    await api.get('/patients/me/plan/')
    expect(copies()).toHaveLength(0)
  })

  it('when on, keeps the plan and serves it back when the phone is offline', async () => {
    setCopyEnabled(true)
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ tasks: ['walk'] }))
    await api.get('/patients/me/plan/')
    expect(copies()).toHaveLength(1)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await api.get('/patients/me/plan/')).toEqual({ tasks: ['walk'] })
    expect(showingCopy.value).toBe(true)
    fetchMock.mockResolvedValue(json({ tasks: ['walk', 'rest'] })) // back online: live data replaces the copy
    await api.get('/patients/me/plan/')
    expect(showingCopy.value).toBe(false)
  })

  it('never keeps blood pressure, check-ins, messages or anyone else\'s record', async () => {
    setCopyEnabled(true)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ results: [] }))
    for (const path of [
      '/patients/me/readings/', '/patients/me/checkins/', '/patients/me/summary/', '/patients/me/messages/',
      '/patients/0b6f7c8e-1d2a-4c3b-9e8f-7a6b5c4d3e2f/plan/', '/inbox/', '/me/export/',
    ])
      await api.get(path)
    expect(copies()).toHaveLength(0)
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const err = await api.get('/patients/me/readings/').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError) // no copy to fall back on: the normal offline error
  })

  it('keeps the plan-type data it is allowed to', () => {
    setCopyEnabled(true)
    for (const path of [
      '/patients/me/plan/', '/patients/me/medications/', '/patients/me/calendar/', '/patients/me/goals/',
      '/patients/me/phases/', '/patients/me/phrases/', '/patients/me/mobility/', '/me/care-team/', '/me/reminders/upcoming/',
    ])
      saveCopy(path, undefined, { ok: true })
    expect(copies()).toHaveLength(9)
  })

  it('a saved copy belongs to one person and is not shown to another', () => {
    setCopyEnabled(true)
    saveCopy('/patients/me/plan/', undefined, { tasks: ['private'] })
    expect(readCopy('/patients/me/plan/')).toEqual({ tasks: ['private'] })
    setCopyOwner('person-b')
    expect(readCopy('/patients/me/plan/')).toBeNull()
  })

  it('turning it off, or signing out, removes everything', () => {
    setCopyEnabled(true)
    saveCopy('/patients/me/plan/', undefined, { a: 1 })
    saveCopy('/patients/me/goals/', undefined, { b: 2 })
    expect(copies()).toHaveLength(2)
    wipeCopies()
    expect(copies()).toHaveLength(0)
    saveCopy('/patients/me/plan/', undefined, { a: 1 })
    setCopyEnabled(false)
    expect(copies()).toHaveLength(0)
    expect(localStorage.getItem('sc-offline-copy')).toBeNull()
  })

  it('does not keep anything without a signed-in owner', () => {
    setCopyEnabled(true)
    setCopyOwner(null)
    saveCopy('/patients/me/plan/', undefined, { a: 1 })
    expect(copies()).toHaveLength(0)
  })

  it('keeps separate copies for different query strings', () => {
    setCopyEnabled(true)
    saveCopy('/patients/me/mobility/', { days: 30 }, { n: 30 })
    saveCopy('/patients/me/progress/', { days: 7 }, { n: 7 })
    expect(readCopy('/patients/me/mobility/', { days: 30 })).toEqual({ n: 30 })
    expect(readCopy('/patients/me/mobility/', { days: 7 })).toBeNull()
  })
})
