<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCheck, PhPlus, PhPrinter, PhTrash } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import VoiceNotes from '@/components/VoiceNotes.vue'
import VoiceRecorder from '@/components/VoiceRecorder.vue'
import { useLoader } from '@/composables/useLoader'
import { byWho, useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t, locale } = useI18n()
const { base, isSelf } = useSubject()
const questions = useLoader(() => api.get(`${base.value}/visit-questions/`))
const voice = useLoader(() => api.get(`${base.value}/voice-notes/`))
const forPrint = useLoader(
  async () => ({
    summary: await api.get(`${base.value}/summary/`).catch(() => null),
    meds: await api.get(`${base.value}/medications/`).catch(() => null),
  }),
  false,
)
async function printPage() {
  await forPrint.reload()
  setTimeout(() => window.print(), 50)
}
const draft = ref('')
const open = computed(() => (questions.data.value?.results ?? []).filter((q: any) => !q.discussed))

async function add() {
  if (!draft.value.trim()) return
  try {
    await api.post(`${base.value}/visit-questions/`, { text: draft.value })
    draft.value = ''
    questions.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
async function toggle(q: any) {
  await api.patch(`${base.value}/visit-questions/${q.id}/`, { discussed: !q.discussed })
  questions.reload()
}
async function remove(q: any) {
  try {
    await api.del(`${base.value}/visit-questions/${q.id}/`)
    questions.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
</script>

<template>
  <main class="page">
    <div class="no-print stack">
      <PageHeader :title="t('visit.title')" :subtitle="t('visit.lead')" back />
      <form class="sc-card row pad" style="flex-wrap: nowrap" @submit.prevent="add">
        <label class="visually-hidden" for="q">{{ t('visit.new') }}</label>
        <input id="q" v-model="draft" class="sc-input" :placeholder="t('visit.placeholder')" maxlength="500" style="border: 0; background: var(--surface-2)" />
        <button class="sc-btn sc-btn-primary" style="width: 3.5rem; padding: 0" :aria-label="t('visit.add')"><PhPlus :size="24" /></button>
      </form>
      <VoiceRecorder :base="base" context="visit" @saved="voice.reload()" />

      <h2>{{ t('visit.toAsk', { n: open.length }) }}</h2>
      <EmptyState v-if="!questions.data.value?.results?.length" :text="t('visit.empty')" />
      <ul class="list">
        <li v-for="q in questions.data.value?.results ?? []" :key="q.id" class="sc-card list-row" :style="{ opacity: q.discussed ? 0.6 : 1 }">
          <button class="tick" style="width: 2rem; height: 2rem; border-radius: 0.6rem" :aria-pressed="q.discussed" :aria-label="t('visit.discussed')" @click="toggle(q)"><PhCheck v-if="q.discussed" :size="16" weight="bold" /></button>
          <span class="stack-s" style="flex-grow: 1">
            <strong :style="{ textDecoration: q.discussed ? 'line-through' : 'none' }">{{ q.text }}</strong>
            <span class="tiny">{{ t(`roles.by.${byWho(q.entered_by_role, isSelf)}`) }} · {{ new Date(q.created_at).toLocaleDateString(locale) }}</span>
          </span>
          <button class="icon-btn" :aria-label="t('common.delete')" @click="remove(q)"><PhTrash :size="18" /></button>
        </li>
      </ul>

      <h2 v-if="voice.data.value?.results?.length">{{ t('voice.notes') }}</h2>
      <VoiceNotes :base="base" :notes="voice.data.value?.results ?? []" can-delete @changed="voice.reload()" />

      <button class="sc-btn sc-btn-ghost" @click="printPage"><PhPrinter :size="22" />{{ t('visit.print') }}</button>
    </div>

    <section class="print-only">
      <h1>{{ t('visit.printTitle') }}</h1>
      <p>{{ new Date().toLocaleDateString(locale) }}</p>
      <h2>{{ t('visit.toAsk', { n: open.length }) }}</h2>
      <ol><li v-for="q in open" :key="q.id">{{ q.text }}</li></ol>
      <h2>{{ t('meds.title') }}</h2>
      <ul><li v-for="m in forPrint.data.value?.meds?.medications ?? []" :key="m.id">{{ m.name }} · {{ m.dose }} · {{ m.times.join(', ') }}</li></ul>
      <template v-if="forPrint.data.value?.summary">
        <h2>{{ t('summary.title') }}</h2>
        <p>{{ t('summary.readings', { n: forPrint.data.value.summary.blood_pressure.readings }) }} ·
          {{ forPrint.data.value.summary.blood_pressure.average_systolic ?? '-' }} / {{ forPrint.data.value.summary.blood_pressure.average_diastolic ?? '-' }} mmHg</p>
        <p>{{ forPrint.data.value.summary.disclaimer }}</p>
      </template>
    </section>
  </main>
</template>

<style scoped>
.print-only { display: none; }
@media print {
  .print-only { display: block; }
  .no-print { display: none; }
}
</style>
