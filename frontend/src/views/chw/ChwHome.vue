<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhCaretRight, PhCloudArrowUp, PhKey, PhMapPin } from '@phosphor-icons/vue'

import { pendingCount } from '@/api/offline'
import { api } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import { useLoader } from '@/composables/useLoader'
import { useAuth } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuth()
const { data } = useLoader(() => api.get('/patients/'))
</script>

<template>
  <main class="page">
    <section class="hero-head sc-hero">
      <h1 style="font-size: 1.9rem">{{ t('chw.title') }}</h1>
      <p class="muted">{{ t('chw.lead') }}</p>
      <button v-if="pendingCount" class="sc-btn sc-glass" style="color: var(--on-hero)" @click="auth.syncOutbox()"><PhCloudArrowUp :size="22" />{{ t('offline.sendNow', { n: pendingCount }) }}</button>
    </section>
    <EmptyState v-if="data && !data.length" :text="t('chw.empty')" />
    <RouterLink v-if="data && !data.length" to="/sharing" class="sc-btn sc-btn-primary"><PhKey :size="22" />{{ t('sharing.enterCode') }}</RouterLink>
    <div v-for="p in data ?? []" :key="p.patient_id" class="sc-card pad stack-s sc-rise">
      <div class="row-between"><strong style="font-size: 1.15rem">{{ p.display_name }}</strong><span class="tiny">{{ t(`roles.${p.patient_role}`) }}</span></div>
      <span class="small muted">{{ p.facts.days_since_check_in == null ? t('caseload.never') : t('caseload.daysAgo', { n: p.facts.days_since_check_in }) }} · {{ t('caseload.lastCheckin') }}</span>
      <div class="grid-2">
        <RouterLink :to="`/p/${p.patient_id}/home-visit`" class="sc-btn sc-btn-primary"><PhMapPin :size="20" />{{ t('visitLog.record') }}</RouterLink>
        <RouterLink :to="`/p/${p.patient_id}/summary`" class="sc-btn sc-btn-ghost">{{ t('caseload.open') }}<PhCaretRight :size="18" /></RouterLink>
      </div>
    </div>
  </main>
</template>
