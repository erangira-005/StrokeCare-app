<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { PhSpeakerHigh } from '@phosphor-icons/vue'

import { api } from '@/api/client'
import DraftNote from '@/components/DraftNote.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { useSpeech } from '@/composables/useSpeech'
import { usePrefs } from '@/stores/prefs'

const { t, locale } = useI18n()
const route = useRoute()
const prefs = usePrefs()
const { canSpeak, speak } = useSpeech()
const { data, error } = useLoader(() => api.get(`/education/${route.params.slug}/`, { lang: locale.value }))
</script>

<template>
  <main class="page">
    <p v-if="error" class="error">{{ error }}</p>
    <template v-if="data">
      <PageHeader :title="data.title" :subtitle="data.summary" back />
      <div class="row">
        <DraftNote :status="data.clinical_review.status" :source="data.source.name" />
        <a v-if="data.source.url" :href="data.source.url" target="_blank" rel="noopener" class="small">{{ t('learn.source') }}</a>
      </div>
      <button v-if="canSpeak" class="sc-btn sc-btn-ghost" @click="speak(`${data.title}. ${data.body}`)"><PhSpeakerHigh :size="22" />{{ t('common.readAloud') }}</button>
      <video v-if="data.video_url && !prefs.prefs.low_data_mode" :src="data.video_url" controls preload="none" style="width: 100%; border-radius: 1rem"></video>
      <article class="sc-card pad-l" style="font-size: 1.1rem; line-height: 1.6; white-space: pre-line">{{ data.body }}</article>
      <p v-if="data.fell_back" class="tiny">{{ t('learn.fellBack') }}</p>
    </template>
  </main>
</template>
