<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  PhCircleHalf, PhDownloadSimple, PhHandPointing, PhListChecks, PhMoonStars, PhPersonSimpleWalk, PhShareNetwork,
  PhSignOut, PhSpeakerHigh, PhSun, PhTextAa, PhTrash, PhWifiSlash,
} from '@phosphor-icons/vue'

import { PhBellRinging, PhCloudArrowDown, PhUsersThree } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import { copyEnabled, setCopyEnabled } from '@/api/copy'
import PageHeader from '@/components/PageHeader.vue'
import { toast } from '@/composables/useToast'
import { LOCALES, setLocale, type Locale } from '@/i18n'
import { useAuth } from '@/stores/auth'
import { usePrefs, type Prefs } from '@/stores/prefs'

const { t, locale } = useI18n()
const auth = useAuth()
const store = usePrefs()
const router = useRouter()
const password = ref('')

async function pick<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  try {
    await store.set(key, value, auth.signedIn)
  } catch (e) {
    toast(errorText(e))
  }
}
function toggleCopy() {
  const turningOff = copyEnabled.value
  setCopyEnabled(!copyEnabled.value)
  if (turningOff) toast(t('settings.offlineCopyRemoved'))
}
async function language(code: Locale) {
  setLocale(code)
  if (auth.signedIn) auth.user = await api.patch('/me/', { preferred_language: code })
}
async function exportData() {
  const blob = await api.blob('/me/export/')
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'strokecare-my-data.json' })
  a.click()
}
async function deleteAccount() {
  if (!confirm(t('settings.deleteConfirm'))) return
  try {
    await api.del('/me/', { password: password.value })
    auth.forget()
    router.replace('/welcome')
  } catch (e) {
    toast(errorText(e))
  }
}
async function signOut() {
  await auth.logout()
  router.replace('/welcome')
}

const switches: { key: keyof Prefs; icon: unknown }[] = [
  { key: 'high_contrast', icon: PhCircleHalf },
  { key: 'easy_read_font', icon: PhTextAa },
  { key: 'reduce_motion', icon: PhPersonSimpleWalk },
  { key: 'audio_first', icon: PhSpeakerHigh },
  { key: 'one_question_at_a_time', icon: PhListChecks },
  { key: 'one_handed_layout', icon: PhHandPointing },
  { key: 'low_data_mode', icon: PhWifiSlash },
]
</script>

<template>
  <main class="page">
    <PageHeader :title="t('settings.title')" :subtitle="auth.user ? `${auth.user.display_name} · ${t(`roles.${auth.user.role}`)}` : ''" />
    <p v-if="auth.user && ['clinician', 'chw'].includes(auth.user.role)" class="banner">{{ auth.user.is_verified_professional ? t('settings.verified') : t('settings.notVerified') }}</p>

    <section class="sc-card pad stack">
      <h2>{{ t('settings.language') }}</h2>
      <div class="row" role="group" :aria-label="t('settings.language')">
        <button v-for="l in LOCALES" :key="l.code" class="sc-chip" :aria-pressed="locale === l.code" @click="language(l.code)">{{ l.name }}</button>
      </div>
      <p class="tiny">{{ t('settings.translationNote') }}</p>
    </section>

    <section class="sc-card pad stack">
      <h2>{{ t('settings.look') }}</h2>
      <div class="grid-2" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
        <button v-for="[v, icon] in [['system', PhCircleHalf], ['light', PhSun], ['dark', PhMoonStars]] as const" :key="v" class="sc-chip" style="flex-direction: column; min-height: 4.5rem; justify-content: center" :aria-pressed="store.prefs.theme === v" @click="pick('theme', v)">
          <component :is="icon" :size="22" />{{ t(`settings.theme.${v}`) }}
        </button>
      </div>
      <div class="row" role="group" :aria-label="t('settings.textSize')" style="flex-wrap: nowrap">
        <button v-for="(v, i) in [100, 125, 150, 200] as const" :key="v" class="sc-chip" style="flex: 1; justify-content: center; font-weight: 800" :style="{ fontSize: `${1 + i * 0.25}rem` }" :aria-pressed="store.prefs.text_scale === v" :aria-label="t(`settings.size.${v}`)" @click="pick('text_scale', v)">A</button>
      </div>
    </section>

    <section class="sc-card" style="padding: 0.25rem 1rem">
      <button v-for="s in switches" :key="s.key" role="switch" :aria-checked="!!store.prefs[s.key]" class="row full" style="flex-wrap: nowrap; min-height: 4rem; padding: 0.5rem 0; border: 0; border-bottom: 1px solid var(--line); background: transparent; color: var(--ink); text-align: left; cursor: pointer" @click="pick(s.key, !store.prefs[s.key] as never)">
        <span class="sc-iconbox" style="width: 2.6rem; height: 2.6rem"><component :is="s.icon" :size="22" /></span>
        <span class="stack-s" style="flex-grow: 1"><strong>{{ t(`settings.pref.${s.key}`) }}</strong><span class="tiny">{{ t(`settings.prefHint.${s.key}`) }}</span></span>
        <span :style="{ width: '3.25rem', height: '1.9rem', borderRadius: '1rem', background: store.prefs[s.key] ? 'var(--primary)' : 'var(--line-strong)', position: 'relative', flexShrink: 0, transition: 'background-color .2s' }">
          <span :style="{ position: 'absolute', top: '0.2rem', left: store.prefs[s.key] ? '1.55rem' : '0.2rem', width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: '#fff', transition: 'left .2s' }"></span>
        </span>
      </button>
    </section>

    <section v-if="auth.isPatient" class="sc-card" style="padding: 0.25rem 1rem">
      <button role="switch" :aria-checked="copyEnabled" class="row full" style="flex-wrap: nowrap; min-height: 4rem; padding: 0.5rem 0; border: 0; background: transparent; text-align: left; cursor: pointer; color: var(--ink)" @click="toggleCopy">
        <span class="sc-iconbox" style="width: 2.6rem; height: 2.6rem"><PhCloudArrowDown :size="22" /></span>
        <span class="stack-s" style="flex-grow: 1"><strong>{{ t('settings.offlineCopy') }}</strong><span class="tiny">{{ t('settings.offlineCopyHint') }}</span></span>
        <span :style="{ width: '3.25rem', height: '1.9rem', borderRadius: '1rem', background: copyEnabled ? 'var(--primary)' : 'var(--line-strong)', position: 'relative', flexShrink: 0, transition: 'background-color .2s' }">
          <span :style="{ position: 'absolute', top: '0.2rem', left: copyEnabled ? '1.55rem' : '0.2rem', width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: '#fff', transition: 'left .2s' }"></span>
        </span>
      </button>
    </section>

    <template v-if="auth.signedIn">
      <RouterLink v-if="auth.isPatient" to="/reminders" class="sc-btn sc-btn-ghost"><PhBellRinging :size="22" />{{ t('reminders.title') }}</RouterLink>
      <RouterLink v-if="auth.isPatient" to="/care-team" class="sc-btn sc-btn-ghost"><PhUsersThree :size="22" />{{ t('team.title') }}</RouterLink>
      <RouterLink v-if="auth.role !== 'admin'" to="/sharing" class="sc-btn sc-btn-ghost"><PhShareNetwork :size="22" />{{ t('sharing.title') }}</RouterLink>
      <button class="sc-btn sc-btn-ghost" @click="exportData"><PhDownloadSimple :size="22" />{{ t('settings.export') }}</button>
      <button class="sc-btn sc-btn-ghost" @click="signOut"><PhSignOut :size="22" />{{ t('auth.signOut') }}</button>
      <details class="sc-card pad">
        <summary style="cursor: pointer; font-weight: 700">{{ t('settings.delete') }}</summary>
        <div class="stack" style="margin-top: 0.75rem">
          <p class="small muted">{{ t('settings.deleteHint') }}</p>
          <label class="field">{{ t('auth.password') }}<input v-model="password" class="sc-input" type="password" autocomplete="current-password" /></label>
          <button class="sc-btn sc-btn-danger" :disabled="!password" @click="deleteAccount"><PhTrash :size="20" />{{ t('settings.deleteButton') }}</button>
        </div>
      </details>
    </template>
  </main>
</template>
