<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhChatCircleText } from '@phosphor-icons/vue'

import { api } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'

const { t, locale } = useI18n()
const { data } = useLoader(() => api.get('/inbox/'))
</script>

<template>
  <main class="page">
    <PageHeader :title="t('messages.inbox')" :subtitle="data?.notice" />
    <EmptyState v-if="data && !data.results.length" :text="t('messages.noThreads')" />
    <RouterLink v-for="th in data?.results ?? []" :key="th.patient_ref" :to="`/p/${th.patient_ref}/messages`" class="sc-card pad row" style="text-decoration: none; color: var(--ink); flex-wrap: nowrap">
      <span class="sc-iconbox"><PhChatCircleText :size="26" weight="duotone" /></span>
      <span class="stack-s" style="flex-grow: 1; min-width: 0">
        <strong>{{ th.patient_ref === 'me' ? t('messages.myTeam') : th.patient_name }}</strong>
        <span class="small muted" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ th.last_message?.body ?? t('messages.none') }}</span>
        <span v-if="th.last_message" class="tiny">{{ new Date(th.last_message.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) }}</span>
      </span>
      <span v-if="th.unread" class="sc-chip" aria-pressed="true" style="min-height: 2rem">{{ th.unread }}</span>
    </RouterLink>
  </main>
</template>
