<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     One question at a time, big answers, every question skippable. Safety rule: an answer listed in a question's
     urgent_values shows emergency guidance AT ONCE, before anything is sent. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { PhCaretRight, PhCheck, PhSiren, PhSpeakerHigh, PhX } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import DraftNote from '@/components/DraftNote.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { useSpeech } from '@/composables/useSpeech'
import { useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t, locale } = useI18n()
const router = useRouter()
const { base, isSelf } = useSubject()
const { canSpeak, speak } = useSpeech()
const { data } = useLoader(() => api.get('/checkin-questions/', { lang: locale.value }))
const questions = computed<any[]>(() => data.value?.results ?? [])
const step = ref(0)
const answers = ref<Record<string, { value: unknown; skipped: boolean }>>({})
const guidance = ref<any>(null)
const finished = ref(false)
const error = ref('')

const q = computed(() => questions.value[step.value])
const urgentNow = computed(() => q.value && q.value.urgent_values?.includes(answers.value[q.value.code]?.value))
const anyUrgent = computed(() => questions.value.some((x) => x.urgent_values?.includes(answers.value[x.code]?.value)))

function answer(value: unknown) {
  answers.value[q.value.code] = { value, skipped: false }
}
function skip() {
  answers.value[q.value.code] = { value: null, skipped: true }
  next()
}
function next() {
  if (step.value < questions.value.length - 1) step.value++
  else submit()
}

async function submit() {
  error.value = ''
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

    <template v-if="!finished && q">
      <div role="img" :aria-label="t('checkin.progress', { n: step + 1, total: questions.length })" :style="{ display: 'grid', gridTemplateColumns: `repeat(${questions.length}, 1fr)`, gap: '6px' }">
        <span v-for="(x, i) in questions" :key="x.code" :style="{ height: '6px', borderRadius: '3px', background: i <= step ? 'var(--primary)' : 'var(--line-strong)' }"></span>
      </div>
      <p class="small muted">{{ t('checkin.progress', { n: step + 1, total: questions.length }) }}</p>
      <div :key="q.code" class="stack sc-rise">
        <h2 style="font-size: 1.7rem; line-height: 1.25">{{ q.prompt }}</h2>
        <button v-if="canSpeak" class="sc-btn sc-btn-ghost" style="align-self: flex-start; min-height: 2.75rem" @click="speak(q.prompt)"><PhSpeakerHigh :size="20" />{{ t('common.readAloud') }}</button>

        <div v-if="q.answer_type === 'yes_no'" class="grid-2">
          <button class="sc-card choice" :aria-pressed="answers[q.code]?.value === true" @click="answer(true)"><PhCheck :size="40" weight="duotone" />{{ t('common.yes') }}</button>
          <button class="sc-card choice" :aria-pressed="answers[q.code]?.value === false" @click="answer(false)"><PhX :size="40" weight="duotone" />{{ t('common.no') }}</button>
        </div>
        <div v-else-if="q.answer_type === 'choice'" class="stack">
          <button v-for="c in q.choices" :key="c.value" class="sc-card choice choice-row" :aria-pressed="answers[q.code]?.value === c.value" @click="answer(c.value)">{{ c.label }}</button>
        </div>
        <div v-else-if="q.answer_type === 'scale_5'" class="row" style="flex-wrap: nowrap">
          <button v-for="n in 5" :key="n" class="sc-card choice" style="flex: 1; min-height: 4.5rem" :aria-pressed="answers[q.code]?.value === n" @click="answer(n)">{{ n }}</button>
        </div>
        <label v-else class="field">{{ t('checkin.yourWords') }}
          <textarea class="sc-input" :value="(answers[q.code]?.value as string) ?? ''" @input="answer(($event.target as HTMLTextAreaElement).value)"></textarea>
        </label>

        <section v-if="urgentNow" role="alert" class="sc-card banner-urgent pad stack sc-sheet">
          <p class="row" style="flex-wrap: nowrap; align-items: flex-start; font-weight: 700; font-size: 1.1rem"><PhSiren :size="30" weight="duotone" style="color: var(--danger)" />{{ t('emergency.message') }}</p>
          <RouterLink to="/emergency" class="sc-btn sc-btn-danger">{{ t('emergency.open') }}</RouterLink>
        </section>

        <button class="sc-btn" style="background: transparent; color: var(--ink-2); text-decoration: underline" @click="skip">{{ t('checkin.skip') }}</button>
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
