// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
// Display and input preferences. Saved to the account (so they follow the person) and to the phone (so they
// apply before signing in). Applied to <html> as data attributes the design tokens read.
import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

import { api } from '@/api/client'

export interface Prefs {
  theme: 'system' | 'light' | 'dark'
  high_contrast: boolean
  easy_read_font: boolean
  reduce_motion: boolean
  text_scale: 100 | 125 | 150 | 200
  audio_first: boolean
  one_question_at_a_time: boolean
  one_handed_layout: boolean
  low_data_mode: boolean
}

const KEY = 'sc-prefs'
const DEFAULTS: Prefs = {
  theme: 'system',
  high_contrast: false,
  easy_read_font: false,
  reduce_motion: false,
  text_scale: 100,
  audio_first: false,
  one_question_at_a_time: false,
  one_handed_layout: false,
  low_data_mode: false,
}

function stored(): Partial<Prefs> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export const usePrefs = defineStore('prefs', () => {
  const prefs = reactive<Prefs>({ ...DEFAULTS, ...stored() })

  function applyToPage() {
    const root = document.documentElement
    const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    root.dataset.theme = prefs.high_contrast ? 'contrast' : dark ? 'dark' : 'light'
    root.dataset.font = prefs.easy_read_font ? 'easy' : 'standard'
    root.dataset.motion = prefs.reduce_motion ? 'reduce' : 'full'
    root.dataset.hand = prefs.one_handed_layout ? 'one' : 'two'
    root.style.fontSize = `${prefs.text_scale}%`
  }

  watch(
    prefs,
    () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(prefs))
      } catch {
        /* not saved on this phone; the account still has them */
      }
      applyToPage()
    },
    { deep: true },
  )
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyToPage)

  async function loadFromAccount() {
    Object.assign(prefs, await api.get<Prefs>('/me/accessibility/'))
  }

  async function set<K extends keyof Prefs>(key: K, value: Prefs[K], signedIn: boolean) {
    prefs[key] = value
    if (signedIn) await api.patch('/me/accessibility/', { [key]: value })
  }

  applyToPage()
  return { prefs, set, loadFromAccount, applyToPage }
})
