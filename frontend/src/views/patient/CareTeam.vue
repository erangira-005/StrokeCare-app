<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     "My care team": who may see my records, my current stage and my next appointment. The person always knows who
     can see their information, and can change it under Sharing. -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhCalendarCheck, PhChatCircleText, PhShareNetwork, PhStethoscope, PhUsersThree } from '@phosphor-icons/vue'

import { api } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'

const { t, locale } = useI18n()
const team = useLoader(() => api.get('/me/care-team/'))
const when = (iso: string) => new Date(iso).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' })
const day = (iso: string) => new Date(iso).toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<template>
  <main class="page">
    <PageHeader :title="t('team.title')" :subtitle="t('team.lead')" back />

    <section v-if="team.data.value?.current_phase" class="sc-card pad stack-s">
      <span class="sc-eyebrow">{{ t('recovery.stage') }}</span>
      <strong style="font-size: 1.2rem">{{ team.data.value.current_phase.name }}</strong>
      <RouterLink to="/p/me/recovery" class="small">{{ t('recovery.title') }}</RouterLink>
    </section>

    <RouterLink to="/p/me/calendar" class="sc-card pad row" style="text-decoration: none; color: var(--ink)">
      <span class="sc-iconbox"><PhCalendarCheck :size="26" weight="duotone" /></span>
      <span class="stack-s">
        <span class="sc-eyebrow">{{ t('team.next') }}</span>
        <template v-if="team.data.value?.next_appointment"><strong>{{ team.data.value.next_appointment.title }}</strong><span class="small muted">{{ when(team.data.value.next_appointment.starts_at) }}</span></template>
        <span v-else class="muted">{{ t('team.noNext') }}</span>
      </span>
    </RouterLink>

    <EmptyState v-if="team.data.value && !team.data.value.team.length" :text="t('team.none')" />
    <div v-for="m in team.data.value?.team ?? []" :key="m.link_id" class="sc-card list-row">
      <span class="sc-iconbox"><component :is="m.relation === 'clinician' ? PhStethoscope : PhUsersThree" :size="24" weight="duotone" /></span>
      <span class="stack-s" style="flex-grow: 1">
        <strong>{{ m.display_name }}</strong>
        <span class="small muted">{{ t(`roles.${m.relation}`) }}<template v-if="m.since"> · {{ t('team.since', { date: day(m.since) }) }}</template></span>
      </span>
    </div>

    <div class="grid-2">
      <RouterLink to="/p/me/messages" class="sc-btn sc-btn-primary"><PhChatCircleText :size="20" />{{ t('team.message') }}</RouterLink>
      <RouterLink to="/sharing" class="sc-btn sc-btn-ghost"><PhShareNetwork :size="20" />{{ t('team.manage') }}</RouterLink>
    </div>
  </main>
</template>
