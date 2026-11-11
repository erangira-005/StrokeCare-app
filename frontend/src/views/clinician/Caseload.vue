<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rule: "needs a look" filters are plain facts (dates, counts). No risk score, no ranking. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { PhCaretRight, PhFunnel, PhKey, PhMagnifyingGlass } from '@phosphor-icons/vue'

import { api } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'

const { t, locale } = useI18n()
const route = useRoute()
const allowed = ['urgent', 'no_check_in', 'doses_not_marked']
const needs = ref(allowed.includes(String(route.query.needs)) ? String(route.query.needs) : '')
const search = ref('')
const { data, reload } = useLoader(() => api.get('/patients/', { needs: needs.value }))
const rows = computed(() => (data.value ?? []).filter((p: any) => p.display_name.toLowerCase().includes(search.value.toLowerCase())))
function filter(n: string) {
  needs.value = n
  reload()
}
const lastCheckin = (f: any) =>
  f.days_since_check_in == null ? t('caseload.never') : f.days_since_check_in === 0 ? t('caseload.today') : t('caseload.daysAgo', { n: f.days_since_check_in })
</script>

<template>
  <main class="page page-wide">
    <PageHeader :title="t('caseload.title')" :subtitle="new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })" />
    <div class="row-between">
      <label class="sc-card row" style="padding: 0 0.9rem; min-height: 3rem; box-shadow: none; flex-wrap: nowrap; min-width: 16rem">
        <PhMagnifyingGlass :size="20" /><span class="visually-hidden">{{ t('caseload.search') }}</span>
        <input v-model="search" :placeholder="t('caseload.search')" style="border: 0; outline: 0; background: transparent; color: var(--ink); font: inherit; flex-grow: 1" />
      </label>
      <RouterLink to="/sharing" class="sc-btn sc-btn-ghost" style="min-height: 3rem"><PhKey :size="20" />{{ t('sharing.enterCode') }}</RouterLink>
    </div>
    <div class="row" role="group" :aria-label="t('caseload.needs')">
      <span class="row small muted" style="gap: 0.35rem; font-weight: 700"><PhFunnel :size="18" />{{ t('caseload.needs') }}</span>
      <button v-for="n in ['', 'urgent', 'no_check_in', 'doses_not_marked']" :key="n" class="sc-chip" :aria-pressed="needs === n" @click="filter(n)">{{ t(`caseload.filter.${n || 'all'}`) }}</button>
    </div>
    <EmptyState v-if="data && !rows.length" :text="t('caseload.empty')" />
    <div v-else class="sc-card table-wrap">
      <table class="data" style="min-width: 48rem">
        <thead><tr>
          <th scope="col">{{ t('caseload.person') }}</th><th scope="col">{{ t('caseload.lastCheckin') }}</th><th scope="col">{{ t('caseload.urgent') }}</th>
          <th scope="col">{{ t('caseload.doses') }}</th><th scope="col">{{ t('caseload.messages') }}</th><th scope="col"><span class="visually-hidden">{{ t('common.open') }}</span></th>
        </tr></thead>
        <tbody>
          <tr v-for="p in rows" :key="p.patient_id">
            <th scope="row" style="text-transform: none; letter-spacing: 0; font-size: 1rem; color: var(--ink)">{{ p.display_name }}<br /><span class="tiny">{{ t(`roles.${p.patient_role}`) }}</span></th>
            <td>{{ 'days_since_check_in' in p.facts ? lastCheckin(p.facts) : '—' }}</td>
            <td>{{ p.facts.urgent_yes_last_7_days ?? '—' }}</td>
            <td>{{ p.facts.doses_not_marked_yesterday ?? '—' }}</td>
            <td>{{ p.facts.unread_messages ?? '—' }}</td>
            <td style="text-align: right"><RouterLink :to="`/p/${p.patient_id}/summary`" class="sc-chip" style="text-decoration: none">{{ t('caseload.open') }}<PhCaretRight :size="16" /></RouterLink></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="tiny">{{ t('caseload.factsOnly') }}</p>
  </main>
</template>
