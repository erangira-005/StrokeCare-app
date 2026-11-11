<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     The movement log: what the person did, for how long and with what help. Plain facts the person enters.
     Safety rule: there is no right amount, no target, no score, and no streak. Fewer taps: "same as last time". -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhArrowCounterClockwise, PhTrash } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { byWho, useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t, locale } = useI18n()
const { base, isSelf } = useSubject()
const log = useLoader(() => api.get(`${base.value}/mobility/`, { days: 30 }))
const kinds = ['walking', 'standing', 'stretching', 'wheelchair', 'other']
const helps = ['alone', 'with_aid', 'with_person']
const quick = [5, 10, 15, 20, 30, 45, 60]
const form = reactive({ kind: 'walking', minutes: '' as number | '', help: '', note: '' })
const saving = ref(false)

const entries = computed<any[]>(() => log.data.value?.results ?? [])
const last = computed(() => entries.value[0] ?? null)
const weekStart = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().slice(0, 10)
})
const week = computed(() => {
  const rows = entries.value.filter((e) => e.date >= weekStart.value)
  return { n: rows.length, minutes: rows.reduce((sum, e) => sum + (e.minutes ?? 0), 0) }
})
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale.value, { weekday: 'short', day: 'numeric', month: 'short' })

async function send(body: Record<string, unknown>) {
  saving.value = true
  try {
    // client_id lets the server keep one entry even if the phone retries after being offline
    const r = await api.post(`${base.value}/mobility/`, { ...body, client_id: crypto.randomUUID() }, { queueable: true })
    toast(r?.queued ? t('offline.saved') : t('mobility.added'))
    log.reload()
    return true
  } catch (e) {
    toast(errorText(e))
    return false
  } finally {
    saving.value = false
  }
}
async function save() {
  const ok = await send({
    kind: form.kind, minutes: form.minutes === '' ? null : Number(form.minutes), help: form.help, note: form.note,
  })
  if (ok) Object.assign(form, { minutes: '', note: '' })
}
const repeatLast = () =>
  last.value && send({ kind: last.value.kind, minutes: last.value.minutes, help: last.value.help, note: '' })
async function remove(e: any) {
  try {
    await api.del(`${base.value}/mobility/${e.id}/`)
    log.reload()
  } catch (err) {
    toast(errorText(err))
  }
}
</script>

<template>
  <main class="page">
    <PageHeader :title="t('mobility.title')" :subtitle="isSelf ? t('mobility.lead') : t('mobility.leadOther')" back />

    <button v-if="last" class="sc-card pad row" style="color: var(--ink); cursor: pointer; text-align: left" :disabled="saving" @click="repeatLast">
      <span class="sc-iconbox"><PhArrowCounterClockwise :size="24" weight="duotone" /></span>
      <span class="stack-s">
        <strong>{{ t('mobility.repeat') }}</strong>
        <span class="small muted">{{ t('mobility.repeatHint', { what: `${t(`mobility.kinds.${last.kind}`)}${last.minutes ? ', ' + t('mobility.min', { n: last.minutes }) : ''}` }) }}</span>
      </span>
    </button>

    <form class="sc-card pad stack" @submit.prevent="save">
      <strong>{{ t('mobility.what') }}</strong>
      <div class="row" role="group" :aria-label="t('mobility.what')">
        <button v-for="k in kinds" :key="k" type="button" class="sc-chip" :aria-pressed="form.kind === k" @click="form.kind = k">{{ t(`mobility.kinds.${k}`) }}</button>
      </div>
      <strong>{{ t('mobility.minutes') }}</strong>
      <div class="row" role="group" :aria-label="t('mobility.minutes')">
        <button v-for="m in quick" :key="m" type="button" class="sc-chip" :aria-pressed="form.minutes === m" @click="form.minutes = form.minutes === m ? '' : m">{{ t('mobility.min', { n: m }) }}</button>
      </div>
      <strong>{{ t('mobility.helpQ') }}</strong>
      <div class="row" role="group" :aria-label="t('mobility.helpQ')">
        <button v-for="h in helps" :key="h" type="button" class="sc-chip" :aria-pressed="form.help === h" @click="form.help = form.help === h ? '' : h">{{ t(`mobility.help.${h}`) }}</button>
      </div>
      <label class="field">{{ t('common.noteOptional') }}<input v-model="form.note" class="sc-input" maxlength="500" /></label>
      <button class="sc-btn sc-btn-primary" :disabled="saving">{{ t('common.save') }}</button>
    </form>

    <section v-if="entries.length" class="sc-card pad stack-s">
      <strong>{{ t('mobility.week') }}</strong>
      <span class="muted">{{ t('mobility.entries', { n: week.n }, week.n) }} · {{ t('mobility.total', { n: week.minutes }) }}</span>
    </section>

    <EmptyState v-if="log.data.value && !entries.length" :text="t('mobility.none')" />
    <div v-for="e in entries" :key="e.id" class="sc-card list-row">
      <span class="stack-s" style="flex-grow: 1">
        <strong>{{ t(`mobility.kinds.${e.kind}`) }}<template v-if="e.minutes"> · {{ t('mobility.min', { n: e.minutes }) }}</template></strong>
        <span class="small muted">{{ dayLabel(e.date) }}<template v-if="e.help"> · {{ t(`mobility.help.${e.help}`) }}</template> · {{ t(`roles.by.${byWho(e.entered_by_role, isSelf)}`) }}</span>
        <span v-if="e.note" class="small">{{ e.note }}</span>
      </span>
      <button class="icon-btn" :aria-label="t('common.delete')" @click="remove(e)"><PhTrash :size="18" /></button>
    </div>
  </main>
</template>
