<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Works without signal: the visit gets its own id on the phone and is sent when there is a connection.
     Sending twice never creates two visits. The checklist records what was done; it asks for no diagnosis. -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { PhCheck } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import DraftNote from '@/components/DraftNote.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t, locale } = useI18n()
const router = useRouter()
const { base } = useSubject()
const { data } = useLoader(() => api.get('/home-visit-checklist/', { lang: locale.value }))
const done = ref<Record<string, boolean>>({})
const form = reactive({ systolic: '', diastolic: '', note: '' })
const error = ref('')

async function save() {
  error.value = ''
  const body: Record<string, unknown> = {
    client_id: crypto.randomUUID(),
    visited_at: new Date().toISOString(),
    checklist: done.value,
    note: form.note,
  }
  if (form.systolic || form.diastolic) Object.assign(body, { systolic: +form.systolic, diastolic: +form.diastolic })
  try {
    const r = await api.post(`${base.value}/home-visits/`, body, { queueable: true })
    toast(r?.queued ? t('offline.saved') : t('visitLog.saved'))
    router.back()
  } catch (e) {
    error.value = errorText(e)
  }
}
</script>

<template>
  <main class="page">
    <PageHeader :title="t('visitLog.record')" :subtitle="t('visitLog.lead')" back />
    <form class="stack" @submit.prevent="save">
      <section class="sc-card pad stack">
        <h2>{{ t('visitLog.whatDone') }}</h2>
        <button v-for="item in data?.results ?? []" :key="item.code" type="button" class="row" style="flex-wrap: nowrap; min-height: 3.5rem; border: 0; background: transparent; color: var(--ink); text-align: left; cursor: pointer; padding: 0" :aria-pressed="!!done[item.code]" @click="done[item.code] = !done[item.code]">
          <span class="tick" style="width: 2.25rem; height: 2.25rem; border-radius: 0.7rem" :aria-pressed="!!done[item.code]"><PhCheck v-if="done[item.code]" :size="18" weight="bold" /></span>
          <span style="font-weight: 600">{{ item.label }}</span>
        </button>
        <DraftNote />
      </section>
      <section class="sc-card pad stack">
        <h2>{{ t('visitLog.reading') }}</h2>
        <div class="grid-2">
          <label class="field">{{ t('bp.top') }}<input v-model="form.systolic" class="sc-input" inputmode="numeric" pattern="[0-9]*" /></label>
          <label class="field">{{ t('bp.bottom') }}<input v-model="form.diastolic" class="sc-input" inputmode="numeric" pattern="[0-9]*" /></label>
        </div>
        <span class="tiny">{{ t('visitLog.readingHint') }}</span>
      </section>
      <label class="field">{{ t('common.noteOptional') }}<textarea v-model="form.note" class="sc-input" maxlength="1000"></textarea></label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="sc-btn sc-btn-primary thumb-actions">{{ t('visitLog.save') }}</button>
    </form>
  </main>
</template>
