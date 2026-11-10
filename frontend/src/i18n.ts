// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
// English, Kinyarwanda and French. English is the fallback, so a missing translation never shows a blank.
// The French and Kinyarwanda texts are AI drafts: a native speaker must review them (docs/OPEN_QUESTIONS.md).
import { createI18n } from 'vue-i18n'

import { setApiLocale } from '@/api/client'
import en from '@/locales/en.json'
import fr from '@/locales/fr.json'
import rw from '@/locales/rw.json'

export type Locale = 'en' | 'rw' | 'fr'
export const LOCALES: { code: Locale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'rw', name: 'Ikinyarwanda' },
  { code: 'fr', name: 'Français' },
]

function initial(): Locale {
  let saved: string | null = null
  try {
    saved = localStorage.getItem('sc-locale')
  } catch {
    /* ignore */
  }
  const guess = saved ?? navigator.language?.slice(0, 2)
  return (LOCALES.some((l) => l.code === guess) ? guess : 'en') as Locale
}

export const i18n = createI18n({
  legacy: false,
  locale: initial(),
  fallbackLocale: 'en',
  messages: { en, fr, rw },
  missingWarn: false,
  fallbackWarn: false,
})

export function setLocale(code: Locale) {
  i18n.global.locale.value = code
  document.documentElement.lang = code
  setApiLocale(code)
  try {
    localStorage.setItem('sc-locale', code)
  } catch {
    /* ignore */
  }
}
setLocale(i18n.global.locale.value as Locale)
