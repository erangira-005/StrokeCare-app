<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rule: alerts are facts, not an emergency service; the notice says so. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PhBell, PhCalendarCheck, PhChatCircleText, PhClipboardText, PhHeartbeat, PhKey, PhNotePencil, PhPill,
} from '@phosphor-icons/vue'

import { api } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import { useLoader } from '@/composables/useLoader'

const { t, locale } = useI18n()
const alerts = useLoader(() => api.get('/alerts/'))
const people = useLoader(() => api.get('/patients/'))
const chosen = ref<string>('')
watch(people.data, (rows: any) => (chosen.value ||= rows?.[0]?.patient_id ?? ''))
const person = computed(() => (people.data.value ?? []).find((p: any) => p.patient_id === chosen.value))
const today = useLoader(async () => {
  if (!chosen.value) return null
  const [plan, meds] = await Promise.all([
    api.get(`/patients/${chosen.value}/plan/`).catch(() => null),
    api.get(`/patients/${chosen.value}/medications/`).catch(() => null),
  ])
  return { plan, meds }
}, false)
watch(chosen, () => today.reload())

async function read(id?: string) {
  await api.post(id ? `/alerts/${id}/read/` : '/alerts/read-all/')
  alerts.reload()
}
const p = (page: string) => `/p/${chosen.value}/${page}`
const alertParams = (a: any) => ({
  ...a.detail,
  name: a.patient_name,
  date: a.detail?.date ? new Date(`${a.detail.date}T12:00:00`).toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' }) : '',
})
</script>

<template>
  <main class="page">
    <section class="hero-head sc-hero">
      <p class="muted" style="font-weight: 600">{{ t('care.caringFor') }}</p>
      <div class="row">
        <select v-if="(people.data.value ?? []).length > 1" v-model="chosen" class="sc-input sc-glass" style="color: var(--on-hero); max-width: 20rem" :aria-label="t('care.choose')">
          <option v-for="x in people.data.value" :key="x.patient_id" :value="x.patient_id" style="color: #000">{{ x.display_name }}</option>
        </select>
        <h1 v-else style="font-size: 1.9rem">{{ person?.display_name ?? '—' }}</h1>
      </div>
      <div v-if="today.data.value" class="grid-2" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
        <div class="sc-glass pad stack-s"><strong style="font-size: 1.4rem">{{ (today.data.value.plan?.tasks ?? []).filter((x: any) => x.done_today).length }}/{{ today.data.value.plan?.tasks?.length ?? 0 }}</strong><span class="tiny" style="color: var(--on-hero-2)">{{ t('care.tasks') }}</span></div>
        <div class="sc-glass pad stack-s"><strong style="font-size: 1.4rem">{{ today.data.value.meds?.doses_marked_taken ?? 0 }}/{{ today.data.value.meds?.doses_due ?? 0 }}</strong><span class="tiny" style="color: var(--on-hero-2)">{{ t('care.doses') }}</span></div>
        <div class="sc-glass pad stack-s"><strong style="font-size: 1.4rem">{{ person?.facts?.days_since_check_in === 0 ? '✓' : '—' }}</strong><span class="tiny" style="color: var(--on-hero-2)">{{ t('care.checkin') }}</span></div>
      </div>
    </section>

    <EmptyState v-if="people.data.value && !people.data.value.length" :text="t('care.noPeople')" />
    <RouterLink v-if="people.data.value && !people.data.value.length" to="/sharing" class="sc-btn sc-btn-primary"><PhKey :size="22" />{{ t('sharing.enterCode') }}</RouterLink>

    <section class="stack">
      <div class="row-between">
        <h2 class="row"><PhBell :size="24" weight="duotone" />{{ alerts.data.value?.unread ? t('care.newAlerts', { n: alerts.data.value.unread }) : t('care.caughtUp') }}</h2>
        <button v-if="alerts.data.value?.unread" class="sc-btn" style="background: transparent; color: var(--primary-ink); min-height: 2.75rem" @click="read()">{{ t('care.markAllRead') }}</button>
      </div>
      <div v-for="a in alerts.data.value?.results ?? []" :key="a.id" class="sc-card pad stack-s sc-rise" :style="{ opacity: a.read ? 0.6 : 1 }">
        <strong>{{ t(`alerts.${a.kind}`, alertParams(a)) }}</strong>
        <span class="tiny">{{ new Date(a.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) }}</span>
        <div class="row">
          <RouterLink v-if="a.kind === 'urgent_answer'" to="/emergency" class="sc-chip" style="text-decoration: none">{{ t('emergency.open') }}</RouterLink>
          <RouterLink v-else-if="a.kind === 'doses_not_marked'" :to="`/p/${a.patient_id}/medicines`" class="sc-chip" style="text-decoration: none">{{ t('meds.title') }}</RouterLink>
          <RouterLink v-else :to="`/p/${a.patient_id}/checkin`" class="sc-chip" style="text-decoration: none">{{ t('checkin.title') }}</RouterLink>
          <button v-if="!a.read" class="sc-chip" @click="read(a.id)">{{ t('care.markRead') }}</button>
        </div>
      </div>
      <p class="tiny">{{ alerts.data.value?.note ?? t('care.alertNote') }}</p>
    </section>

    <nav v-if="chosen" class="grid-2" :aria-label="t('care.actions')">
      <RouterLink :to="p('bp')" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhHeartbeat :size="26" weight="duotone" />{{ t('bp.add') }}</RouterLink>
      <RouterLink :to="p('medicines')" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhPill :size="26" weight="duotone" />{{ t('meds.title') }}</RouterLink>
      <RouterLink :to="p('checkin')" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhClipboardText :size="26" weight="duotone" />{{ t('checkin.title') }}</RouterLink>
      <RouterLink :to="p('calendar')" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhCalendarCheck :size="26" weight="duotone" />{{ t('calendar.title') }}</RouterLink>
      <RouterLink :to="p('visit')" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhNotePencil :size="26" weight="duotone" />{{ t('visit.title') }}</RouterLink>
      <RouterLink :to="p('messages')" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhChatCircleText :size="26" weight="duotone" />{{ t('messages.title') }}</RouterLink>
    </nav>
  </main>
</template>
