<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
  PhBookOpenText, PhChatCircleText, PhCopy, PhHeartbeat, PhHouse, PhMapPin, PhNotePencil, PhStethoscope, PhUserCircle,
  PhUsersThree, PhWifiSlash,
} from '@phosphor-icons/vue'

import EmergencyLink from '@/components/EmergencyLink.vue'
import ToastHost from '@/components/ToastHost.vue'
import { showingCopy } from '@/api/copy'
import { pendingCount } from '@/api/offline'
import { setLocale, type Locale } from '@/i18n'
import { useAuth } from '@/stores/auth'
import { usePrefs } from '@/stores/prefs'

const auth = useAuth()
const prefs = usePrefs()
const route = useRoute()
const { t } = useI18n()
const online = ref(navigator.onLine)
onMounted(() => {
  window.addEventListener('online', () => (online.value = true))
  window.addEventListener('offline', () => (online.value = false))
})

watch(
  () => auth.user,
  async (u) => {
    if (!u) return
    setLocale(u.preferred_language as Locale)
    try {
      await prefs.loadFromAccount()
    } catch {
      /* keep the phone's settings */
    }
  },
  { immediate: true },
)

const tabs = computed(() => {
  const r = auth.role
  if (!auth.signedIn)
    return [
      { to: '/welcome', label: t('nav.home'), icon: PhHouse },
      { to: '/talk', label: t('nav.talk'), icon: PhChatCircleText },
      { to: '/learn', label: t('nav.learn'), icon: PhBookOpenText },
    ]
  if (r === 'caregiver')
    return [
      { to: '/care', label: t('nav.home'), icon: PhHouse },
      { to: '/inbox', label: t('nav.messages'), icon: PhChatCircleText },
      { to: '/talk', label: t('nav.talk'), icon: PhUsersThree },
      { to: '/settings', label: t('nav.me'), icon: PhUserCircle },
    ]
  if (r === 'clinician')
    return [
      { to: '/doctor', label: t('nav.doctor'), icon: PhStethoscope },
      { to: '/caseload', label: t('nav.caseload'), icon: PhUsersThree },
      { to: '/inbox', label: t('nav.messages'), icon: PhChatCircleText },
      { to: '/templates', label: t('nav.templates'), icon: PhCopy },
      { to: '/settings', label: t('nav.me'), icon: PhUserCircle },
    ]
  if (r === 'chw')
    return [
      { to: '/chw', label: t('nav.visits'), icon: PhMapPin },
      { to: '/inbox', label: t('nav.messages'), icon: PhChatCircleText },
      { to: '/learn', label: t('nav.learn'), icon: PhBookOpenText },
      { to: '/settings', label: t('nav.me'), icon: PhUserCircle },
    ]
  if (r === 'admin') return [{ to: '/settings', label: t('nav.me'), icon: PhUserCircle }]
  return [
    { to: '/today', label: t('nav.today'), icon: PhHouse },
    { to: '/learn', label: t('nav.learn'), icon: PhBookOpenText },
    { to: '/p/me/visit', label: t('nav.myVisit'), icon: PhNotePencil },
    { to: '/p/me/messages', label: t('nav.messages'), icon: PhChatCircleText },
    { to: '/settings', label: t('nav.me'), icon: PhUserCircle },
  ]
})
const wide = computed(() => auth.role === 'clinician')
const bare = computed(() => ['/login', '/register', '/consent'].includes(route.path))
</script>

<template>
  <div :class="{ 'layout-wide': wide }">
    <nav v-if="wide && !bare" class="side-nav sc-hero" :aria-label="t('nav.main')">
      <RouterLink to="/doctor" class="brand" style="color: var(--on-hero); padding: 0 0.5rem 1.25rem">
        <span class="brand-mark sc-glass"><PhHeartbeat :size="22" weight="duotone" /></span>StrokeCare
      </RouterLink>
      <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="side-link">
        <component :is="tab.icon" :size="22" />{{ tab.label }}
      </RouterLink>
    </nav>

    <div>
      <header v-if="!bare" class="topbar">
        <RouterLink :to="auth.signedIn ? auth.home : '/welcome'" class="brand">
          <span class="brand-mark"><PhHeartbeat :size="22" weight="duotone" /></span>
          <span>StrokeCare</span>
        </RouterLink>
        <EmergencyLink />
      </header>

      <p v-if="!online || pendingCount" class="banner" role="status" style="margin: 0.75rem 1rem 0">
        <PhWifiSlash :size="20" />
        <span v-if="!online">{{ t('offline.notice') }}</span>
        <span v-if="pendingCount">{{ t('offline.pending', { n: pendingCount }) }}</span>
      </p>

      <p v-if="showingCopy" class="banner" role="status" style="margin: 0.75rem 1rem 0"><PhWifiSlash :size="20" /><span>{{ t('offline.copyShown') }}</span></p>

      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in"><component :is="Component" :key="route.fullPath" /></Transition>
      </RouterView>

      <nav v-if="!bare" class="sc-tabbar bottom-nav" :aria-label="t('nav.main')">
        <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" custom v-slot="{ href, navigate, isActive }">
          <a :href="href" class="sc-tab" :aria-current="isActive ? 'page' : undefined" @click="navigate">
            <component :is="tab.icon" :size="26" :weight="isActive ? 'fill' : 'regular'" />{{ tab.label }}
          </a>
        </RouterLink>
      </nav>
    </div>
    <ToastHost />
  </div>
</template>

<style>
.page-enter-active, .page-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; }
[data-motion="reduce"] .page-enter-active, [data-motion="reduce"] .page-leave-active { transition: none; }
</style>
