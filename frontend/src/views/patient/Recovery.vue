<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Personal recovery in one place: the stage the clinician named, the person's own goals, and ways into the
     movement log and progress. Safety rule: no score, no target, no judgement. The stage is the clinician's wording. -->
<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCaretRight, PhChartBar, PhCheck, PhPersonSimpleWalk, PhPlus, PhTarget, PhTrash } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'
import { useAuth } from '@/stores/auth'

const { t, locale } = useI18n()
const auth = useAuth()
const { base, isSelf, link } = useSubject()
const phases = useLoader(() => api.get(`${base.value}/phases/`))
const goals = useLoader(() => api.get(`${base.value}/goals/`))
const current = computed(() => (phases.data.value?.results ?? []).find((p: any) => p.is_current) ?? null)
const canWrite = computed(() => auth.role !== 'clinician') // goals are the person's own words
const form = reactive({ text: '', date: '' })
const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })

async function add() {
  if (!form.text.trim()) return
  try {
    await api.post(`${base.value}/goals/`, { text: form.text, target_date: form.date || null })
    Object.assign(form, { text: '', date: '' })
    goals.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
async function toggle(g: any) {
  try {
    await api.patch(`${base.value}/goals/${g.id}/`, { done: !g.done })
    goals.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
async function remove(g: any) {
  try {
    await api.del(`${base.value}/goals/${g.id}/`)
    goals.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
</script>

<template>
  <main class="page">
    <PageHeader :title="isSelf ? t('recovery.title') : t('recovery.titleOther')" :subtitle="t('recovery.lead')" back />

    <section class="sc-card pad stack sc-rise">
      <span class="sc-eyebrow">{{ t('recovery.stage') }}</span>
      <template v-if="current">
        <h2 style="font-size: 1.5rem">{{ current.name }}</h2>
        <span class="small muted">{{ current.ends_on ? t('recovery.range', { from: fmt(current.starts_on), to: fmt(current.ends_on) }) : t('recovery.since', { from: fmt(current.starts_on) }) }} · {{ t('recovery.stageFrom') }}</span>
        <div v-if="current.care_needed" class="stack-s">
          <strong class="small">{{ t('recovery.careNeeded') }}</strong>
          <p style="white-space: pre-line">{{ current.care_needed }}</p>
        </div>
      </template>
      <p v-else class="muted">{{ isSelf ? t('recovery.noStage') : t('recovery.noStageOther') }}</p>
    </section>

    <section class="stack">
      <h2 class="row"><PhTarget :size="24" weight="duotone" />{{ isSelf ? t('recovery.goals') : t('recovery.goalsOther') }}</h2>
      <form v-if="canWrite" class="sc-card pad stack-s" @submit.prevent="add">
        <p class="small muted">{{ t('recovery.goalLead') }}</p>
        <label class="visually-hidden" for="goal">{{ t('recovery.goals') }}</label>
        <input id="goal" v-model="form.text" class="sc-input" maxlength="200" :placeholder="t('recovery.goalPlaceholder')" />
        <label class="field">{{ t('recovery.goalDate') }}<input v-model="form.date" class="sc-input" type="date" /></label>
        <span class="tiny">{{ t('recovery.goalWish') }}</span>
        <button class="sc-btn sc-btn-primary" :disabled="!form.text.trim()"><PhPlus :size="20" />{{ t('recovery.goalAdd') }}</button>
      </form>
      <EmptyState v-if="goals.data.value && !goals.data.value.results.length" :text="t('recovery.goalNone')" />
      <div v-for="g in goals.data.value?.results ?? []" :key="g.id" class="sc-card list-row" :style="{ opacity: g.done ? 0.7 : 1 }">
        <button class="tick" :aria-pressed="g.done" :aria-label="g.done ? t('recovery.goalUnmark') : t('recovery.goalMark')" @click="toggle(g)"><PhCheck v-if="g.done" class="sc-pop" :size="22" weight="bold" /></button>
        <span class="stack-s" style="flex-grow: 1">
          <strong :style="{ textDecoration: g.done ? 'line-through' : 'none' }">{{ g.text }}</strong>
          <span v-if="g.target_date" class="small muted">{{ fmt(g.target_date) }}</span>
        </span>
        <button v-if="canWrite" class="icon-btn" :aria-label="t('common.delete')" @click="remove(g)"><PhTrash :size="18" /></button>
      </div>
    </section>

    <nav class="stack-s">
      <RouterLink :to="link('mobility')" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhPersonSimpleWalk :size="26" weight="duotone" /><strong style="flex-grow: 1">{{ t('mobility.title') }}</strong><PhCaretRight :size="18" /></RouterLink>
      <RouterLink :to="link('progress')" class="sc-card pad row" style="text-decoration: none; color: var(--ink)"><PhChartBar :size="26" weight="duotone" /><strong style="flex-grow: 1">{{ t('progress.title') }}</strong><PhCaretRight :size="18" /></RouterLink>
    </nav>
  </main>
</template>
