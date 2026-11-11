<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     The doctor's home: who may need a look, today's appointments and unread messages, at a glance.
     Safety rule: plain facts the patients entered, listed by NAME. No risk score and no ranking by importance. -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhCalendarCheck, PhCaretRight, PhInfo, PhUsersThree } from '@phosphor-icons/vue'

import { api } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import { useLoader } from '@/composables/useLoader'

const { t, locale } = useI18n()
const o = useLoader(() => api.get('/doctor/overview/'))
const time = (iso: string) => new Date(iso).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
const dayTime = (iso: string) => new Date(iso).toLocaleString(locale.value, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const COUNTS = ['urgent', 'no_check_in', 'doses_not_marked', 'unread_messages']
</script>

<template>
  <main class="page">
    <header class="stack-s sc-rise">
      <h1>{{ t('doctor.hello', { name: o.data.value?.display_name ?? '' }) }}</h1>
      <p v-if="o.data.value" class="muted">{{ t('doctor.people', { n: o.data.value.patients_total }, o.data.value.patients_total) }}</p>
    </header>

    <template v-if="o.data.value">
      <section class="stack-s">
        <h2>{{ t('doctor.glance') }}</h2>
        <div class="grid-2">
          <RouterLink v-for="c in COUNTS" :key="c" :to="c === 'unread_messages' ? '/inbox' : `/caseload?needs=${c}`" class="sc-card pad stack-s" style="text-decoration: none; color: var(--ink)">
            <strong style="font-size: 2rem">{{ o.data.value.counts[c] }}</strong>
            <span class="small muted">{{ t(`doctor.reasons.${c}`) }}</span>
          </RouterLink>
        </div>
      </section>

      <section class="stack-s">
        <h2>{{ t('doctor.needs') }}</h2>
        <p class="small muted">{{ t('doctor.needsLead') }}</p>
        <EmptyState v-if="!o.data.value.needs_a_look.length" :text="t('doctor.none')" />
        <RouterLink v-for="p in o.data.value.needs_a_look" :key="p.patient_id" :to="`/p/${p.patient_id}/summary`" class="sc-card list-row" style="text-decoration: none; color: var(--ink)">
          <span class="sc-iconbox" style="width: 2.75rem; height: 2.75rem"><PhUsersThree :size="22" weight="duotone" /></span>
          <span class="stack-s" style="flex-grow: 1">
            <strong>{{ p.display_name }}</strong>
            <span v-for="r in p.reasons" :key="r" class="small muted">{{ t(`doctor.reasons.${r}`) }}</span>
          </span>
          <PhCaretRight :size="18" />
        </RouterLink>
      </section>

      <section class="stack-s">
        <h2 class="row"><PhCalendarCheck :size="24" weight="duotone" />{{ t('doctor.today') }}</h2>
        <EmptyState v-if="!o.data.value.appointments_today.length" :text="t('doctor.noToday')" />
        <RouterLink v-for="e in o.data.value.appointments_today" :key="e.event_id" :to="`/p/${e.patient_id}/calendar`" class="sc-card list-row" style="text-decoration: none; color: var(--ink)">
          <strong style="width: 3.5rem">{{ time(e.starts_at) }}</strong>
          <span class="stack-s"><strong>{{ e.patient_name }}</strong><span class="small muted">{{ e.title }}<template v-if="e.location"> · {{ e.location }}</template></span></span>
        </RouterLink>
        <template v-if="o.data.value.appointments_next_days.length">
          <h3 class="sc-eyebrow" style="font-size: 0.85rem">{{ t('doctor.next') }}</h3>
          <RouterLink v-for="e in o.data.value.appointments_next_days" :key="e.event_id" :to="`/p/${e.patient_id}/calendar`" class="sc-card list-row" style="text-decoration: none; color: var(--ink)">
            <span class="stack-s"><strong>{{ e.patient_name }}</strong><span class="small muted">{{ dayTime(e.starts_at) }} · {{ e.title }}</span></span>
          </RouterLink>
        </template>
      </section>

      <RouterLink to="/caseload" class="sc-btn sc-btn-primary">{{ t('doctor.openCaseload') }}</RouterLink>
      <p class="row small muted" style="flex-wrap: nowrap; align-items: flex-start"><PhInfo :size="18" /><span>{{ o.data.value.note }}</span></p>
    </template>
    <p v-if="o.error.value" class="error" role="alert">{{ o.error.value }}</p>
  </main>
</template>
