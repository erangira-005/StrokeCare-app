<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     The progress dashboard: what was written down, day by day. Safety rule: counts only. No percentage, score,
     streak, target or colour that means good or bad, and a day with nothing recorded is just an empty day. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhInfo } from '@phosphor-icons/vue'

import { api } from '@/api/client'
import BarChart from '@/components/BarChart.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { useSubject } from '@/composables/useSubject'

const { t, locale } = useI18n()
const { base, link } = useSubject()
const days = ref(7)
const prog = useLoader(() => api.get(`${base.value}/progress/`, { days: days.value }))
watch(days, () => prog.reload())

const d = computed(() => prog.data.value)
const series = (key: string) => (d.value?.days ?? []).map((x: any) => ({ date: x.date, value: x[key] }))
const charts = computed(() => [
  { key: 'tasks_done', label: t('progress.tasks'), total: d.value?.totals.tasks_done },
  { key: 'doses_taken', label: t('progress.doses'), total: d.value?.totals.doses_taken },
  { key: 'mobility_minutes', label: t('progress.minutes'), total: d.value?.totals.mobility_minutes },
])
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale.value, { weekday: 'short', day: 'numeric', month: 'short' })
</script>

<template>
  <main class="page">
    <PageHeader :title="t('progress.title')" :subtitle="t('progress.lead')" back />
    <div class="row" role="group" :aria-label="t('progress.title')">
      <button v-for="n in [7, 14, 30]" :key="n" class="sc-chip" :aria-pressed="days === n" @click="days = n">{{ t('progress.range', { n }) }}</button>
    </div>

    <section v-if="d?.current_phase" class="sc-card pad stack-s">
      <span class="sc-eyebrow">{{ t('recovery.stage') }}</span>
      <strong>{{ d.current_phase.name }}</strong>
    </section>

    <template v-if="d">
      <section v-for="c in charts" :key="c.key" class="sc-card pad stack-s">
        <div class="row-between"><strong>{{ c.label }}</strong><span class="muted">{{ c.total }}</span></div>
        <BarChart :days="series(c.key)" :label="t('progress.chartLabel', { what: c.label, n: days })" />
      </section>
      <p class="row small muted" style="flex-wrap: nowrap; align-items: flex-start"><PhInfo :size="18" /><span>{{ t('progress.chart') }} {{ d.note }}</span></p>

      <section class="sc-card pad stack-s" style="overflow-x: auto">
        <h2>{{ t('progress.table') }}</h2>
        <table class="small" style="width: 100%; border-collapse: collapse">
          <caption class="visually-hidden">{{ t('progress.table') }}</caption>
          <thead>
            <tr style="text-align: left">
              <th scope="col">{{ t('progress.day') }}</th><th scope="col">{{ t('progress.colTasks') }}</th><th scope="col">{{ t('progress.colDoses') }}</th>
              <th scope="col">{{ t('progress.checked') }}</th><th scope="col">{{ t('summary.readingsLabel') }}</th><th scope="col">{{ t('progress.colMinutes') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in [...d.days].reverse()" :key="r.date" style="border-top: 1px solid var(--line)">
              <th scope="row" style="text-align: left; padding: 0.4rem 0.25rem; font-weight: 600">{{ dayLabel(r.date) }}</th>
              <td>{{ r.tasks_total ? `${r.tasks_done}/${r.tasks_total}` : r.tasks_done || '–' }}</td><td>{{ r.doses_due ? `${r.doses_taken}/${r.doses_due}` : '–' }}</td>
              <td>{{ r.checked_in ? t('common.yes') : '–' }}</td><td>{{ r.bp_readings || '–' }}</td><td>{{ r.mobility_minutes || '–' }}</td>
            </tr>
          </tbody>
        </table>
        <h3 class="sc-eyebrow" style="font-size: 0.85rem; margin-top: 0.5rem">{{ t('progress.totals', { n: days }) }}</h3>
        <dl class="grid-2 small" style="margin: 0; gap: 0.35rem 1rem">
          <div><dt class="muted">{{ t('progress.tasks') }}</dt><dd style="margin: 0; font-weight: 700">{{ d.totals.tasks_done }}</dd></div>
          <div><dt class="muted">{{ t('progress.doses') }}</dt><dd style="margin: 0; font-weight: 700">{{ d.totals.doses_taken }}{{ d.totals.doses_due ? ` / ${d.totals.doses_due}` : '' }}</dd></div>
          <div><dt class="muted">{{ t('summary.checkins') }}</dt><dd style="margin: 0; font-weight: 700">{{ d.totals.check_ins }}</dd></div>
          <div><dt class="muted">{{ t('summary.readingsLabel') }}</dt><dd style="margin: 0; font-weight: 700">{{ d.totals.bp_readings }}</dd></div>
          <div><dt class="muted">{{ t('progress.minutes') }}</dt><dd style="margin: 0; font-weight: 700">{{ d.totals.mobility_minutes }}</dd></div>
        </dl>
      </section>
      <RouterLink :to="link('mobility')" class="sc-btn sc-btn-ghost">{{ t('progress.openMovement') }}</RouterLink>
    </template>
    <p v-else-if="prog.loading.value" class="muted" aria-busy="true">…</p>
    <p v-if="prog.error.value" class="error" role="alert">{{ prog.error.value }}</p>
  </main>
</template>
