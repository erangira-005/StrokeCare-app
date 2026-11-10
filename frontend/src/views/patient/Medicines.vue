<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rule: the list is written by the clinician. Here a dose can only be marked as taken. No advice. -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCheck, PhInfo } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { byWho, useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t } = useI18n()
const { base, link, isSelf } = useSubject()
const { data, reload } = useLoader(() => api.get(`${base.value}/medications/`))
const doses = computed(() =>
  (data.value?.medications ?? [])
    .flatMap((m: any) => m.doses_on_day.map((d: any) => ({ ...d, med: m })))
    .sort((a: any, b: any) => a.time.localeCompare(b.time)),
)

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
</script>

<template>
  <main class="page">
    <PageHeader :title="t('meds.title')" :subtitle="t('meds.fromClinician')" back />
    <p v-if="data" class="sc-card pad" style="font-weight: 700">{{ t('meds.summary', { n: data.doses_marked_taken, total: data.doses_due }) }}</p>
    <EmptyState v-if="data && !doses.length" :text="t('meds.none')" />
    <div v-for="(d, i) in doses" :key="d.med.id + d.time" class="sc-card sc-rise list-row" :style="{ animationDelay: `${Number(i) * 40}ms` }">
      <strong style="width: 3.5rem; font-size: 1.15rem">{{ d.time }}</strong>
      <span class="stack-s" style="flex-grow: 1">
        <strong>{{ d.med.name }}</strong>
        <span class="small muted">{{ d.taken ? t('meds.marked', { who: t(`roles.by.${byWho(d.entered_by_role, isSelf)}`) }) : d.med.dose }}</span>
      </span>
      <button class="tick" :aria-pressed="d.taken" :aria-label="d.taken ? t('meds.undo') : t('meds.mark')" @click="toggle(d)"><PhCheck v-if="d.taken" class="sc-pop" :size="26" weight="bold" /></button>
    </div>
    <p class="row small muted" style="flex-wrap: nowrap; align-items: flex-start"><PhInfo :size="18" /><span>{{ t('meds.onlyClinician') }} <RouterLink :to="link('visit')">{{ t('visit.title') }}</RouterLink>.</span></p>
  </main>
</template>
