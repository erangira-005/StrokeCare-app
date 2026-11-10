<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rule: numbers only. No colour, label, arrow or "normal range" on any value. -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCheck, PhTrash } from '@phosphor-icons/vue'

import { api, ApiError, errorText } from '@/api/client'
import BpChart from '@/components/BpChart.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { byWho, useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t, locale } = useI18n()
const { base, isSelf } = useSubject()
const { data, reload } = useLoader(() => api.get(`${base.value}/readings/`, { limit: 30 }))
const rows = computed<any[]>(() => data.value?.results ?? [])
const form = reactive({ systolic: '', diastolic: '', context: 'resting', note: '' })
const fields = ref<Record<string, string[]>>({})
const busy = ref(false)
const showAll = ref(false)
const contexts = ['resting', 'morning', 'evening', 'after_activity', 'other']
const topBelowBottom = computed(() => form.systolic && form.diastolic && +form.systolic <= +form.diastolic)

async function save() {
  fields.value = {}
  busy.value = true
  try {
    const r = await api.post(`${base.value}/readings/`, { ...form, systolic: +form.systolic, diastolic: +form.diastolic }, { queueable: true })
    toast(r?.queued ? t('offline.saved') : t('bp.saved'))
    Object.assign(form, { systolic: '', diastolic: '', note: '' })
    reload()
  } catch (e) {
    if (e instanceof ApiError) fields.value = e.fields
    toast(errorText(e))
  } finally {
    busy.value = false
  }
}
async function remove(id: string) {
  try {
    await api.del(`${base.value}/readings/${id}/`)
    reload()
  } catch (e) {
    toast(errorText(e))
  }
}
</script>

<template>
  <main class="page">
    <PageHeader :title="t('bp.title')" back />
    <section class="sc-card pad stack-s">
      <div class="row-between"><h2>{{ t('bp.recent') }}</h2><span class="tiny">{{ t('bp.numbersOnly') }}</span></div>
      <BpChart v-if="rows.length > 1" :readings="rows" />
      <EmptyState v-else-if="!rows.length" :text="t('bp.none')" />
    </section>

    <form class="sc-card pad stack" @submit.prevent="save">
      <h2>{{ t('bp.add') }}</h2>
      <div class="grid-2">
        <label class="field">{{ t('bp.top') }}<input v-model="form.systolic" class="sc-input" inputmode="numeric" pattern="[0-9]*" required style="font-size: 1.9rem; font-weight: 800; min-height: 4.25rem" /></label>
        <label class="field">{{ t('bp.bottom') }}<input v-model="form.diastolic" class="sc-input" inputmode="numeric" pattern="[0-9]*" required style="font-size: 1.9rem; font-weight: 800; min-height: 4.25rem" /></label>
      </div>
      <p class="tiny">{{ t('bp.hint') }}</p>
      <p v-if="topBelowBottom" class="banner" role="alert">{{ t('bp.topAboveBottom') }}</p>
      <p v-for="(msgs, f) in fields" :key="f" class="error">{{ msgs[0] }}</p>
      <div class="row" role="group" :aria-label="t('bp.when')">
        <button v-for="c in contexts" :key="c" type="button" class="sc-chip" :aria-pressed="form.context === c" @click="form.context = c">{{ t(`bp.ctx.${c}`) }}</button>
      </div>
      <label class="field">{{ t('common.noteOptional') }}<input v-model="form.note" class="sc-input" maxlength="500" /></label>
      <button class="sc-btn sc-btn-primary thumb-actions" :disabled="busy"><PhCheck :size="20" />{{ t('bp.save') }}</button>
    </form>

    <section class="stack">
      <h2>{{ t('bp.history') }}</h2>
      <ul class="list">
        <li v-for="r in showAll ? rows : rows.slice(0, 10)" :key="r.id" class="sc-card list-row">
          <span style="font-size: 1.4rem; font-weight: 800">{{ r.systolic }} / {{ r.diastolic }} <span class="tiny">mmHg</span></span>
          <span class="small muted" style="flex-grow: 1; text-align: right">{{ new Date(r.taken_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) }} · {{ t(`roles.by.${byWho(r.entered_by_self ? 'survivor' : r.entered_by_role, isSelf)}`) }}</span>
          <button v-if="isSelf || !r.entered_by_self" class="icon-btn" :aria-label="t('common.delete')" @click="remove(r.id)"><PhTrash :size="18" /></button>
        </li>
      </ul>
      <button v-if="rows.length > 10 && !showAll" class="sc-btn sc-btn-ghost" @click="showAll = true">{{ t('bp.showAll', { n: rows.length }) }}</button>
    </section>
  </main>
</template>
