<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     By default every question is on ONE screen with one Send button, so a tired person makes as few taps as possible.
     With the "One question at a time" setting it goes step by step. Either way every question can be skipped.
     Safety rule: an answer listed in a question's urgent_values shows emergency guidance AT ONCE, before anything is
     sent, and nothing is ever pre-answered for the person. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { PhCaretRight, PhCheck, PhSiren, PhSpeakerHigh } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import DraftNote from '@/components/DraftNote.vue'
import PageHeader from '@/components/PageHeader.vue'
import QuestionInput from '@/components/QuestionInput.vue'
import { useLoader } from '@/composables/useLoader'
import { useSpeech } from '@/composables/useSpeech'
import { useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'
import { usePrefs } from '@/stores/prefs'

type Answer = { value: unknown; skipped: boolean }
const { t, locale } = useI18n()
const router = useRouter()
const prefs = usePrefs()
const { base, isSelf } = useSubject()
const { canSpeak, speak } = useSpeech()
const { data } = useLoader(() => api.get('/checkin-questions/', { lang: locale.value }))
const questions = computed<any[]>(() => data.value?.results ?? [])
const stepByStep = computed(() => !!prefs.prefs.one_question_at_a_time)
const step = ref(0)
const answers = ref<Record<string, Answer>>({})
const guidance = ref<any>(null)
const finished = ref(false)
const error = ref('')

const q = computed(() => questions.value[step.value])
const isUrgent = (x: any) => !!x && !!x.urgent_values?.includes(answers.value[x.code]?.value)
const anyUrgent = computed(() => questions.value.some(isUrgent))

function setAnswer(x: any, a: Answer) {
  answers.value[x.code] = a
}
function skip(x: any) {
  answers.value[x.code] = { value: null, skipped: true }
  if (stepByStep.value) next()
}
function next() {
  if (step.value < questions.value.length - 1) step.value++
  else submit()
}

async function submit() {
  error.value = ''
  // Anything the person left empty is sent as skipped. Nothing is ever answered for them.
  const body = {
    answers: questions.value.map((x) => ({ question: x.code, ...(answers.value[x.code] ?? { value: null, skipped: true }) })),
  }
  try {
    const r = await api.post(`${base.value}/checkins/`, body, { queueable: true })
    guidance.value = r?.emergency_guidance ?? null
    finished.value = true
    toast(r?.queued ? t('offline.saved') : t('checkin.thanks'))
  } catch (e) {
    error.value = errorText(e)
  }
}
</script>

<template>
  <main class="page">
    <PageHeader :title="t('checkin.title')" :subtitle="isSelf ? t('checkin.lead') : t('checkin.leadOther')" back />

    <!-- All questions on one screen (the default) -->
    <template v-if="!finished && questions.length && !stepByStep">
      <p class="small muted">{{ t('checkin.oneScreen') }}</p>
      <section v-for="x in questions" :key="x.code" class="sc-card pad stack">
        <h2 style="font-size: 1.35rem; line-height: 1.3">{{ x.prompt }}</h2>
        <button v-if="canSpeak" type="button" class="sc-btn sc-btn-ghost" style="align-self: flex-start; min-height: 2.75rem" @click="speak(x.prompt)"><PhSpeakerHigh :size="20" />{{ t('common.readAloud') }}</button>
        <QuestionInput :q="x" :model-value="answers[x.code]" @update:model-value="setAnswer(x, $event)" />
        <section v-if="isUrgent(x)" role="alert" class="sc-card banner-urgent pad stack sc-sheet">
          <p class="row" style="flex-wrap: nowrap; align-items: flex-start; font-weight: 700; font-size: 1.1rem"><PhSiren :size="30" weight="duotone" style="color: var(--danger)" />{{ t('emergency.message') }}</p>
          <RouterLink to="/emergency" class="sc-btn sc-btn-danger">{{ t('emergency.open') }}</RouterLink>
        </section>
        <button v-if="!answers[x.code]?.skipped" type="button" class="sc-btn" style="background: transparent; color: var(--ink-2); text-decoration: underline; min-height: 2.5rem" @click="skip(x)">{{ t('checkin.skip') }}</button>
      </section>
      <div class="thumb-actions"><button class="sc-btn sc-btn-primary" style="width: 100%" @click="submit">{{ t('checkin.send') }}<PhCaretRight :size="20" /></button></div>
      <DraftNote :source="t('checkin.source')" />
    </template>

    <!-- One question at a time -->
    <template v-if="!finished && questions.length && stepByStep">
      <div role="img" :aria-label="t('checkin.progress', { n: step + 1, total: questions.length })" :style="{ display: 'grid', gridTemplateColumns: `repeat(${questions.length}, 1fr)`, gap: '6px' }">
        <span v-for="(x, i) in questions" :key="x.code" :style="{ height: '6px', borderRadius: '3px', background: i <= step ? 'var(--primary)' : 'var(--line-strong)' }"></span>
      </div>
      <p class="small muted">{{ t('checkin.progress', { n: step + 1, total: questions.length }) }}</p>
      <div :key="q.code" class="stack sc-rise">
        <h2 style="font-size: 1.7rem; line-height: 1.25">{{ q.prompt }}</h2>
        <button v-if="canSpeak" type="button" class="sc-btn sc-btn-ghost" style="align-self: flex-start; min-height: 2.75rem" @click="speak(q.prompt)"><PhSpeakerHigh :size="20" />{{ t('common.readAloud') }}</button>
        <QuestionInput :q="q" :model-value="answers[q.code]" @update:model-value="setAnswer(q, $event)" />
        <section v-if="isUrgent(q)" role="alert" class="sc-card banner-urgent pad stack sc-sheet">
          <p class="row" style="flex-wrap: nowrap; align-items: flex-start; font-weight: 700; font-size: 1.1rem"><PhSiren :size="30" weight="duotone" style="color: var(--danger)" />{{ t('emergency.message') }}</p>
          <RouterLink to="/emergency" class="sc-btn sc-btn-danger">{{ t('emergency.open') }}</RouterLink>
        </section>
        <button type="button" class="sc-btn" style="background: transparent; color: var(--ink-2); text-decoration: underline" @click="skip(q)">{{ t('checkin.skip') }}</button>
      </div>
      <div class="grid-2 thumb-actions">
        <button class="sc-btn sc-btn-ghost" :disabled="step === 0" @click="step--">{{ t('common.back') }}</button>
        <button class="sc-btn sc-btn-primary" :disabled="!answers[q.code]" @click="next">{{ step === questions.length - 1 ? t('checkin.send') : t('common.next') }}<PhCaretRight :size="20" /></button>
      </div>
      <DraftNote :source="t('checkin.source')" />
    </template>

    <section v-if="finished" class="stack sc-rise">
      <div class="sc-card pad-l stack" style="text-align: center; align-items: center">
        <span class="tick sc-pop" aria-pressed="true" style="width: 4rem; height: 4rem"><PhCheck :size="34" weight="bold" /></span>
        <h2>{{ t('checkin.thanks') }}</h2>
      </div>
      <section v-if="guidance || anyUrgent" role="alert" class="sc-card banner-urgent pad stack">
        <p style="font-weight: 700; font-size: 1.1rem">{{ guidance?.message ?? t('emergency.message') }}</p>
        <RouterLink to="/emergency" class="sc-btn sc-btn-danger">{{ t('emergency.open') }}</RouterLink>
      </section>
      <button class="sc-btn sc-btn-primary" @click="router.back()">{{ t('common.done') }}</button>
    </section>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </main>
</template>
