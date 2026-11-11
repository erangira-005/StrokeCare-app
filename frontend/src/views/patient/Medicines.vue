<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rule: the list is written by the clinician. Here a dose can only be marked as taken. No advice.
     Doses are grouped by part of the day (a display grouping by clock time, not medical guidance), each course shows
     its dates, and one tap marks everything in a part of the day, so a tired person makes fewer taps. -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCheck, PhCheckCircle, PhInfo } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { byWho, useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t, locale } = useI18n()
const { base, link, isSelf } = useSubject()
const { data, reload } = useLoader(() => api.get(`${base.value}/medications/`))
const doses = computed<any[]>(() =>
  (data.value?.medications ?? [])
    .flatMap((m: any) => m.doses_on_day.map((d: any) => ({ ...d, med: m })))
    .sort((a: any, b: any) => a.time.localeCompare(b.time)),
)

const periodOf = (time: string) => {
  const h = Number(time.slice(0, 2))
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'
}
const groups = computed(() =>
  ['morning', 'afternoon', 'evening', 'night']
    .map((period) => ({ period, doses: doses.value.filter((d) => periodOf(d.time) === period) }))
    .filter((g) => g.doses.length),
)
const open = computed(() => doses.value.filter((d) => !d.taken))
const nextDose = computed(() => {
  const now = new Date()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return open.value.find((d) => d.time >= hhmm) ?? open.value[0] ?? null
})
const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale.value, { day: 'numeric', month: 'short', year: 'numeric' })
const course = (m: any) => (m.end_date ? t('meds.courseFromTo', { from: fmt(m.start_date), to: fmt(m.end_date) }) : t('meds.courseFrom', { from: fmt(m.start_date) }))

async function toggle(d: any) {
  try {
    if (d.taken) await api.del(`${base.value}/medications/${d.med.id}/doses/`, undefined, { time: d.time })
    else {
      const r = await api.post(`${base.value}/medications/${d.med.id}/doses/`, { time: d.time }, { queueable: true })
      if (r?.queued) toast(t('offline.saved'))
    }
    reload()
  } catch (e) {
    toast(errorText(e))
  }
}
async function markAll(list: any[]) {
  const todo = list.filter((d) => !d.taken)
  if (!todo.length) return
  try {
    const r = await api.post(
      `${base.value}/medications/doses/bulk/`,
      { doses: todo.map((d) => ({ medication: d.med.id, time: d.time })) },
      { queueable: true },
    )
    toast(r?.queued ? t('offline.saved') : t('meds.markedAll', { n: r?.newly_marked ?? todo.length }))
    reload()
  } catch (e) {
    toast(errorText(e))
  }
}
</script>

<template>
  <main class="page">
    <PageHeader :title="t('meds.title')" :subtitle="t('meds.fromClinician')" back />
    <p v-if="data" class="sc-card pad" style="font-weight: 700">{{ t('meds.summary', { n: data.doses_marked_taken, total: data.doses_due }) }}</p>
    <p v-if="data && doses.length" class="small muted">{{ nextDose ? t('meds.next', { time: nextDose.time, name: nextDose.med.name }) : t('meds.allDone') }}</p>
    <EmptyState v-if="data && !doses.length" :text="t('meds.none')" />

    <section v-for="g in groups" :key="g.period" class="stack-s">
      <div class="row-between">
        <h2 class="sc-eyebrow" style="font-size: 0.9rem">{{ t(`meds.periods.${g.period}`) }}</h2>
        <button v-if="g.doses.some((d) => !d.taken)" class="sc-chip" @click="markAll(g.doses)"><PhCheckCircle :size="18" />{{ t('meds.markAll') }}</button>
      </div>
      <div v-for="(d, i) in g.doses" :key="d.med.id + d.time" class="sc-card sc-rise list-row" :style="{ animationDelay: `${Number(i) * 40}ms` }">
        <strong style="width: 3.5rem; font-size: 1.15rem">{{ d.time }}</strong>
        <span class="stack-s" style="flex-grow: 1">
          <strong>{{ d.med.name }}</strong>
          <span class="small muted">{{ d.taken ? t('meds.marked', { who: t(`roles.by.${byWho(d.entered_by_role, isSelf)}`) }) : d.med.dose }}</span>
          <span class="tiny">{{ course(d.med) }}</span>
        </span>
        <button class="tick" :aria-pressed="d.taken" :aria-label="d.taken ? t('meds.undo') : t('meds.mark')" @click="toggle(d)"><PhCheck v-if="d.taken" class="sc-pop" :size="26" weight="bold" /></button>
      </div>
    </section>
    <p class="row small muted" style="flex-wrap: nowrap; align-items: flex-start"><PhInfo :size="18" /><span>{{ t('meds.onlyClinician') }} <RouterLink :to="link('visit')">{{ t('visit.title') }}</RouterLink></span></p>
  </main>
</template>
