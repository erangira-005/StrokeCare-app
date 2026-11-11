<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PhBellRinging, PhCalendarCheck, PhChartBar, PhChatCircleText, PhCheck, PhClipboardText, PhHeartbeat, PhPersonSimpleWalk, PhPill, PhTarget,
  PhUsersThree,
} from '@phosphor-icons/vue'

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
const stage = ref<any>(null)
const comingUp = ref<any[]>([])
const unread = ref(0)
const loaded = ref(false)

async function load() {
  const results = await Promise.allSettled([
    api.get('/patients/me/plan/'),
    api.get('/patients/me/medications/'),
    api.get('/patients/me/checkins/', { limit: 1 }),
    api.get('/patients/me/readings/', { limit: 1 }),
    api.get('/patients/me/phases/'),
    api.get('/me/reminders/upcoming/'),
    api.get('/inbox/'),
  ])
  const [p, m, c, r, ph, up, inbox] = results.map((x) => (x.status === 'fulfilled' ? x.value : null))
  plan.value = p ?? { has_plan: false, tasks: [] }
  meds.value = m
  lastCheckin.value = c?.results?.[0] ?? null
  lastReading.value = r?.results?.[0] ?? null
  stage.value = (ph?.results ?? []).find((x: any) => x.is_current) ?? null
  // the next few things in the next 36 hours: appointments and reminders, soonest first
  const horizon = Date.now() + 36 * 3600 * 1000
  comingUp.value = (up?.results ?? []).filter((u: any) => new Date(u.next_at).getTime() <= horizon).slice(0, 4)
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

    <RouterLink v-if="stage" to="/p/me/recovery" class="banner" style="text-decoration: none; color: var(--ink)"><PhTarget :size="22" />{{ t('today.stage', { name: stage.name }) }}</RouterLink>
    <section v-if="comingUp.length" class="stack-s" :aria-label="t('today.comingUp')">
      <h2 class="sc-eyebrow" style="font-size: 0.85rem">{{ t('today.comingUp') }}</h2>
      <RouterLink v-for="u in comingUp" :key="u.id" :to="u.kind === 'appointment' ? '/p/me/calendar' : '/reminders'" class="sc-card pad row" style="text-decoration: none; color: var(--ink)">
        <span class="sc-iconbox"><component :is="u.kind === 'appointment' ? PhCalendarCheck : PhBellRinging" :size="26" weight="duotone" /></span>
        <span class="stack-s"><strong>{{ u.kind === 'appointment' ? u.title : t(`reminders.kinds.${u.kind}`) }}</strong><span class="small muted">{{ new Date(u.next_at).toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' }) }}</span></span>
      </RouterLink>
    </section>
    <RouterLink v-if="unread" to="/p/me/messages" class="banner" style="text-decoration: none; color: var(--ink)"><PhChatCircleText :size="22" />{{ t('today.unread', { n: unread }) }}</RouterLink>

    <nav class="stack-s" :aria-label="t('today.more')">
      <h2 class="sc-eyebrow" style="font-size: 0.85rem">{{ t('today.more') }}</h2>
      <div class="grid-2">
        <RouterLink to="/p/me/recovery" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhTarget :size="24" weight="duotone" /><strong>{{ t('recovery.title') }}</strong></RouterLink>
        <RouterLink to="/p/me/mobility" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhPersonSimpleWalk :size="24" weight="duotone" /><strong>{{ t('mobility.title') }}</strong></RouterLink>
        <RouterLink to="/p/me/progress" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhChartBar :size="24" weight="duotone" /><strong>{{ t('progress.title') }}</strong></RouterLink>
        <RouterLink to="/care-team" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhUsersThree :size="24" weight="duotone" /><strong>{{ t('team.title') }}</strong></RouterLink>
      </div>
    </nav>

    <section v-if="plan?.has_plan" class="stack sc-rise" style="animation-delay: 280ms">
      <div class="row-between"><h2>{{ t('today.plan') }}</h2><span class="sc-eyebrow">{{ t('today.fromClinician') }}</span></div>
      <button v-for="task in plan.tasks" :key="task.id" class="sc-card list-row" :aria-pressed="task.done_today" style="color: var(--ink); cursor: pointer; text-align: left" @click="tick(task)">
        <span class="tick" :aria-pressed="task.done_today" style="width: 2.25rem; height: 2.25rem"><PhCheck v-if="task.done_today" class="sc-pop" :size="20" weight="bold" /></span>
        <span class="stack-s"><strong>{{ task.title }}</strong><span v-if="task.instructions" class="small muted">{{ task.instructions }}</span></span>
      </button>
    </section>
  </main>
</template>
