// Owner: Erica Rurangwa Sheja (Product Owner) · AI-assisted draft, see AI_USE_LOG.md
// Every text the app shows exists in English, Kinyarwanda and French, and none is blank.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import en from '../src/locales/en.json'
import fr from '../src/locales/fr.json'
import rw from '../src/locales/rw.json'

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') Object.assign(out, flatten(v as Record<string, unknown>, key))
    else out[key] = String(v)
  }
  return out
}
const E = flatten(en)

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? sources(p) : /\.(vue|ts)$/.test(f) ? [readFileSync(p, 'utf8')] : []
  })
}

describe('translations', () => {
  it.each([['fr', fr], ['rw', rw]])('%s has every English key, none empty, same placeholders', (_name, messages) => {
    const other = flatten(messages as Record<string, unknown>)
    expect(Object.keys(other).sort()).toEqual(Object.keys(E).sort())
    for (const [key, text] of Object.entries(E)) {
      expect(other[key].trim(), key).not.toBe('')
      const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
      expect(holes(other[key]), key).toEqual(holes(text))
    }
  })

  it('every static key used in the code exists', () => {
    const used = new Set<string>()
    for (const src of sources(join(__dirname, '../src'))) {
      for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) used.add(m[1])
    }
    const missing = [...used].filter((k) => !(k in E))
    expect(missing).toEqual([])
  })

  // Messages that deliberately have a singular and a plural form ("1 person | 2 people"), written as `one | other`.
  const PLURAL = new Set(['doctor.people', 'mobility.entries'])

  it('no message uses characters that vue-i18n treats as syntax', () => {
    for (const [key, text] of Object.entries({ ...E, ...flatten(fr), ...flatten(rw) })) {
      if (PLURAL.has(key)) {
        expect(/[@$]/.test(text), key).toBe(false)
        expect(text.split('|'), key).toHaveLength(2) // exactly one separator: a singular and a plural form
      } else expect(/[@|$]/.test(text), key).toBe(false)
    }
  })

  it('plural messages have the same placeholders in both forms and in every language', () => {
    for (const key of PLURAL)
      for (const m of [E, flatten(fr), flatten(rw)]) for (const form of m[key].split('|')) expect(form, key).toContain('{n}')
  })

  it('emergency guidance never contains a phone number', () => {
    for (const m of [en, fr, rw]) expect(/\d/.test(m.emergency.message)).toBe(false)
  })
})
