// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { API_BASE, ApiError, api, onLogout, tokens } from '@/api/client'
import { setCopyOwner, wipeCopies } from '@/api/copy'
import { clearQueue, flush } from '@/api/offline'

export interface User {
  id: string
  email: string
  display_name: string
  role: 'prevention' | 'survivor' | 'caregiver' | 'clinician' | 'chw' | 'admin'
  preferred_language: 'en' | 'fr' | 'rw'
  timezone: string
  is_verified_professional: boolean
}
type Consents = Record<string, { version: string; granted: boolean }>

export const useAuth = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const consents = ref<Consents>({})
  const ready = ref(false)

  const signedIn = computed(() => !!user.value)
  const role = computed(() => user.value?.role)
  const isPatient = computed(() => role.value === 'survivor' || role.value === 'prevention')
  const needsConsent = computed(() => Object.values(consents.value).some((c) => !c.granted))
  const home = computed(() => {
    switch (role.value) {
      case 'caregiver':
        return '/care'
      case 'clinician':
        return '/doctor'
      case 'chw':
        return '/chw'
      case 'admin':
        return '/settings'
      default:
        return '/today'
    }
  })

  function apply(data: { user: User; consents: Consents; access?: string; refresh?: string }) {
    if (data.access && data.refresh) tokens.set(data.access, data.refresh)
    user.value = data.user
    consents.value = data.consents
    setCopyOwner(data.user.id) // a saved copy belongs to one person and is never shown to another
  }

  async function load() {
    if (tokens.access || tokens.refresh) {
      try {
        apply(await api.get('/me/'))
        syncOutbox()
      } catch (err) {
        // Only end the session when the server says the login is no longer valid. No signal, or a server that is
        // briefly down, must never sign someone out: they could not sign back in until they were online again.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) tokens.clear()
      }
    }
    ready.value = true
  }

  async function login(email: string, password: string) {
    apply(await api.post('/auth/login/', { email, password }, { auth: false }))
    syncOutbox()
  }

  async function register(body: Record<string, string>) {
    apply(await api.post('/auth/register/', body, { auth: false }))
  }

  async function giveConsent(kind: string, accept = true) {
    consents.value = await api.post('/me/consents/', { kind, accept })
  }

  function forget() {
    user.value = null
    consents.value = {}
    tokens.clear()
    clearQueue()
    setCopyOwner(null)
    wipeCopies() // the saved copy never outlives the sign-in
  }

  async function logout() {
    const refresh = tokens.refresh
    try {
      if (refresh) await api.post('/auth/logout/', { refresh })
    } finally {
      forget()
    }
  }

  async function syncOutbox() {
    await flush((item) =>
      fetch(`${API_BASE}${item.path}`, {
        method: item.method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access}` },
        body: JSON.stringify(item.body),
      }),
    )
  }

  onLogout(() => forget())
  if (typeof window !== 'undefined') window.addEventListener('online', () => user.value && syncOutbox())

  return {
    user, consents, ready, signedIn, role, isPatient, needsConsent, home,
    load, login, register, giveConsent, logout, forget, syncOutbox, apply,
  }
})
