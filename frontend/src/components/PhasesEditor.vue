<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     For a verified clinician: name each stage of this person's recovery, with dates, in the clinician's own words.
     Safety rule: the app ships no medical definition of a stage. Only the clinician's text is shown to the person. -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhPlus, PhTrash } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import { useLoader } from '@/composables/useLoader'
import { useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t, locale } = useI18n()
const { base } = useSubject()
const phases = useLoader(() => api.get(`${base.value}/phases/`))
const adding = ref(false)
const form = reactive({ name: '', starts_on: '', ends_on: '', care_needed: '' })
const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale.value, { day: 'numeric', month: 'short', year: 'numeric' })

async function add() {
  try {
    await api.post(`${base.value}/phases/`, {
      name: form.name, starts_on: form.starts_on, ends_on: form.ends_on || null, care_needed: form.care_needed,
    })
    Object.assign(form, { name: '', starts_on: '', ends_on: '', care_needed: '' })
    adding.value = false
    phases.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
async function remove(p: any) {
  if (!confirm(t('phase.confirmDelete'))) return
  try {
    await api.del(`${base.value}/phases/${p.id}/`)
    phases.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
</script>

<template>
  <section class="sc-card pad stack">
    <h2>{{ t('phase.title') }}</h2>
    <p class="small muted">{{ t('phase.lead') }}</p>
    <p v-if="phases.data.value && !phases.data.value.results.length" class="muted small">{{ t('phase.none') }}</p>
    <div v-for="p in phases.data.value?.results ?? []" :key="p.id" class="list-row" style="border-top: 1px solid var(--line); padding-top: 0.5rem">
      <span class="stack-s" style="flex-grow: 1">
        <strong>{{ p.name }} <span v-if="p.is_current" class="sc-chip" style="min-height: 1.6rem; padding: 0 0.5rem; font-size: 0.8rem">{{ t('phase.now') }}</span></strong>
        <span class="small muted">{{ p.ends_on ? t('recovery.range', { from: fmt(p.starts_on), to: fmt(p.ends_on) }) : t('recovery.since', { from: fmt(p.starts_on) }) }}</span>
        <span v-if="p.care_needed" class="small" style="white-space: pre-line">{{ p.care_needed }}</span>
      </span>
      <button class="icon-btn" :aria-label="t('common.delete')" @click="remove(p)"><PhTrash :size="18" /></button>
    </div>
    <button v-if="!adding" class="sc-btn sc-btn-ghost" @click="adding = true"><PhPlus :size="20" />{{ t('phase.add') }}</button>
    <form v-else class="stack sc-sheet" @submit.prevent="add">
      <label class="field">{{ t('phase.name') }}<input v-model="form.name" class="sc-input" required maxlength="80" /></label>
      <div class="grid-2">
        <label class="field">{{ t('phase.from') }}<input v-model="form.starts_on" class="sc-input" type="date" required /></label>
        <label class="field">{{ t('phase.to') }}<input v-model="form.ends_on" class="sc-input" type="date" /></label>
      </div>
      <label class="field">{{ t('recovery.careNeeded') }}<textarea v-model="form.care_needed" class="sc-input" maxlength="1000"></textarea></label>
      <div class="grid-2"><button type="button" class="sc-btn sc-btn-ghost" @click="adding = false">{{ t('common.cancel') }}</button><button class="sc-btn sc-btn-primary">{{ t('common.save') }}</button></div>
    </form>
  </section>
</template>
