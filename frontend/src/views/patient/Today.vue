<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCalendarCheck, PhChatCircleText, PhCheck, PhClipboardText, PhHeartbeat, PhPill } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import ProgressRing from '@/components/ProgressRing.vue'
import { toast } from '@/composables/useToast'
import { useAuth } from '@/stores/auth'

const { t, locale } = useI18n()
const auth = useAuth()
const plan = ref<any>(null)
const meds = ref<any>(null)
const lastCheckin = ref<any>(null)
const lastReading = ref<any>(null)
const nextEvent = ref<any>(null)
const unread = ref(0)
const loaded = ref(false)

async function load() {
  const results = await Promise.allSettled([
    api.get('/patients/me/plan/'),
    api.get('/patients/me/medications/'),
    api.get('/patients/me/checkins/', { limit: 1 }),
    api.get('/patients/me/readings/', { limit: 1 }),
    api.get('/patients/me/calendar/'),
    api.get('/inbox/'),
  ])
  const [p, m, c, r, cal, inbox] = results.map((x) => (x.status === 'fulfilled' ? x.value : null))
  plan.value = p ?? { has_plan: false, tasks: [] }
  meds.value = m
  lastCheckin.value = c?.results?.[0] ?? null
  lastReading.value = r?.results?.[0] ?? null
  nextEvent.value = (cal?.results ?? []).find((e: any) => !e.is_done && new Date(e.starts_at) > new Date()) ?? null
  unread.value = inbox?.results?.[0]?.unread ?? 0
  loaded.value = true
}
onMounted(load)

const today = computed(() => plan.value?.date)
const checkedInToday = computed(() => !!lastCheckin.value && lastCheckin.value.date === today.value)
const tasksDone = computed(() => (plan.value?.tasks ?? []).filter((x: any) => x.done_today).length)
const done = computed(() => tasksDone.value + (meds.value?.doses_marked_taken ?? 0) + (checkedInToday.value ? 1 : 0))
const total = computed(() => (plan.value?.tasks?.length ?? 0) + (meds.value?.doses_due ?? 0) + 1)
const greeting = computed(() => {
  const h = new Date().getHours()
  return t(h < 12 ? 'today.morning' : h < 18 ? 'today.afternoon' : 'today.evening', { name: auth.user?.display_name?.split(' ')[0] })
})
const dateLabel = computed(() => new Date().toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' }))

async function tick(task: any) {
  try {
    if (task.done_today) await api.del(`/patients/me/plan/tasks/${task.id}/log/`)
    else await api.post(`/patients/me/plan/tasks/${task.id}/log/`, {}, { queueable: true })
    task.done_today = !task.done_today
  } catch (e) {
    toast(errorText(e))
  }
}
</script>

<template>
  <main class="page">
    <section class="hero-head sc-hero">
      <div class="sc-rise stack-s">
        <p class="muted" style="font-weight: 600">{{ dateLabel }}</p>
        <h1 style="font-size: 1.9rem">{{ greeting }}</h1>
      </div>
      <div v-if="!loaded" class="sc-glass row pad" style="flex-wrap: nowrap" aria-busy="true">
        <span class="sc-skeleton" style="width: 6rem; height: 6rem; border-radius: 50%; opacity: 0.35"></span>
        <span class="stack-s" style="flex-grow: 1"><span class="sc-skeleton" style="height: 1.1rem; opacity: 0.35"></span><span class="sc-skeleton" style="height: 0.9rem; width: 80%; opacity: 0.35"></span><span class="sc-skeleton" style="height: 0.9rem; width: 60%; opacity: 0.35"></span></span>
      </div>
      <div v-else class="sc-glass sc-rise row pad" style="animation-delay: 80ms; flex-wrap: nowrap">
        <ProgressRing :done="done" :total="total" />
        <div class="stack-s">
          <strong style="font-size: 1.1rem">{{ t('today.soFar') }}</strong>
          <span class="muted small">{{ t('today.tasksLine', { n: tasksDone, total: plan?.tasks?.length ?? 0 }) }}</span>
          <span class="muted small">{{ t('today.dosesLine', { n: meds?.doses_marked_taken ?? 0, total: meds?.doses_due ?? 0 }) }}</span>
          <span class="muted small">{{ checkedInToday ? t('today.checkinDone') : t('today.checkinNotYet') }}</span>
        </div>
      </div>
    </section>

    <nav class="grid-2" :aria-label="t('today.quick')">
      <RouterLink to="/p/me/checkin" class="sc-card sc-rise pad stack-s" style="text-decoration: none; color: var(--ink); animation-delay: 120ms">
        <span class="sc-iconbox"><PhClipboardText :size="28" weight="duotone" /></span>
        <strong>{{ t('checkin.title') }}</strong><span class="small muted">{{ checkedInToday ? t('today.checkinDone') : t('checkin.short') }}</span>
      </RouterLink>
      <RouterLink to="/p/me/bp" class="sc-card sc-rise pad stack-s" style="text-decoration: none; color: var(--ink); animation-delay: 160ms">
        <span class="sc-iconbox sc-iconbox-accent"><PhHeartbeat :size="28" weight="duotone" /></span>
        <strong>{{ t('bp.title') }}</strong>
        <span class="small muted">{{ lastReading ? t('bp.last', { s: lastReading.systolic, d: lastReading.diastolic }) : t('bp.none') }}</span>
      </RouterLink>
      <RouterLink to="/p/me/medicines" class="sc-card sc-rise pad stack-s" style="text-decoration: none; color: var(--ink); animation-delay: 200ms">
        <span class="sc-iconbox sc-iconbox-accent"><PhPill :size="28" weight="duotone" /></span>
        <strong>{{ t('meds.title') }}</strong><span class="small muted">{{ t('today.dosesLine', { n: meds?.doses_marked_taken ?? 0, total: meds?.doses_due ?? 0 }) }}</span>
      </RouterLink>
      <RouterLink to="/talk" class="sc-card sc-rise pad stack-s" style="text-decoration: none; color: var(--ink); animation-delay: 240ms">
        <span class="sc-iconbox"><PhChatCircleText :size="28" weight="duotone" /></span>
        <strong>{{ t('talk.title') }}</strong><span class="small muted">{{ t('talk.short') }}</span>
      </RouterLink>
    </nav>

    <RouterLink v-if="nextEvent" to="/p/me/calendar" class="sc-card pad row" style="text-decoration: none; color: var(--ink)">
      <span class="sc-iconbox"><PhCalendarCheck :size="26" weight="duotone" /></span>
      <span class="stack-s"><strong>{{ nextEvent.title }}</strong><span class="small muted">{{ new Date(nextEvent.starts_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) }}</span></span>
    </RouterLink>
    <RouterLink v-if="unread" to="/p/me/messages" class="banner" style="text-decoration: none; color: var(--ink)"><PhChatCircleText :size="22" />{{ t('today.unread', { n: unread }) }}</RouterLink>

    <section v-if="plan?.has_plan" class="stack sc-rise" style="animation-delay: 280ms">
      <div class="row-between"><h2>{{ t('today.plan') }}</h2><span class="sc-eyebrow">{{ t('today.fromClinician') }}</span></div>
      <button v-for="task in plan.tasks" :key="task.id" class="sc-card list-row" :aria-pressed="task.done_today" style="color: var(--ink); cursor: pointer; text-align: left" @click="tick(task)">
        <span class="tick" :aria-pressed="task.done_today" style="width: 2.25rem; height: 2.25rem"><PhCheck v-if="task.done_today" class="sc-pop" :size="20" weight="bold" /></span>
        <span class="stack-s"><strong>{{ task.title }}</strong><span v-if="task.instructions" class="small muted">{{ task.instructions }}</span></span>
      </button>
    </section>
  </main>
</template>
