<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhBookOpenText } from '@phosphor-icons/vue'

import { api } from '@/api/client'
import DraftNote from '@/components/DraftNote.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'

const { t, locale } = useI18n()
const { data, loading } = useLoader(() => api.get('/education/', { lang: locale.value }))
</script>

<template>
  <main class="page">
    <PageHeader :title="t('learn.title')" :subtitle="t('learn.lead')" />
    <EmptyState v-if="!loading && !data?.results?.length" :text="t('learn.empty')" />
    <RouterLink v-for="(item, i) in data?.results ?? []" :key="item.slug" :to="`/learn/${item.slug}`" class="sc-card sc-rise pad row" :style="{ animationDelay: `${Number(i) * 40}ms`, textDecoration: 'none', color: 'var(--ink)', alignItems: 'flex-start' }">
      <span class="sc-iconbox sc-iconbox-accent"><PhBookOpenText :size="26" weight="duotone" /></span>
      <span class="stack-s">
        <strong style="font-size: 1.1rem">{{ item.title }}</strong>
        <span class="muted small">{{ item.summary }}</span>
        <span class="row" style="gap: 0.4rem"><DraftNote :status="item.clinical_review.status" :source="item.source.name" /><span v-if="item.fell_back" class="tiny">{{ t('learn.fellBack') }}</span></span>
      </span>
    </RouterLink>
  </main>
</template>
