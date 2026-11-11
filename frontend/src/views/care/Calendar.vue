<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     The family care calendar: who does what, and handover notes from one carer to the next. -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCalendarCheck, PhCheck, PhPlus, PhTrash } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t, locale } = useI18n()
const { base } = useSubject()
const cal = useLoader(() => api.get(`${base.value}/calendar/`))
const notes = useLoader(() => api.get(`${base.value}/handover/`))
const adding = ref(false)
const form = reactive({ title: '', kind: 'appointment', date: '', time: '09:00', assigned_to: '', location: '', notes: '', remind: '' })
const leads = [15, 30, 60, 120, 1440, 2880]
const note = ref('')
const kinds = ['appointment', 'therapy', 'medicine_pickup', 'transport', 'visit', 'other']

const byDay = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const e of cal.data.value?.results ?? []) {
    const day = new Date(e.starts_at).toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' })
    ;(groups[day] ??= []).push(e)
  }
  return groups
})

async function add() {
  try {
    await api.post(`${base.value}/calendar/`, {
      title: form.title, kind: form.kind, location: form.location, notes: form.notes,
      starts_at: new Date(`${form.date}T${form.time}`).toISOString(), assigned_to: form.assigned_to || null,
      remind_minutes_before: form.remind ? Number(form.remind) : null,
    })
    Object.assign(form, { title: '', location: '', notes: '', remind: '' })
    adding.value = false
    cal.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
async function toggle(e: any) {
  await api.patch(`${base.value}/calendar/${e.id}/`, { done: !e.is_done })
  cal.reload()
}
async function remove(e: any) {
  await api.del(`${base.value}/calendar/${e.id}/`)
  cal.reload()
}
async function addNote() {
  if (!note.value.trim()) return
  try {
    await api.post(`${base.value}/handover/`, { text: note.value })
    note.value = ''
    notes.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
</script>

<template>
  <main class="page">
    <PageHeader :title="t('calendar.title')" :subtitle="t('calendar.lead')" back />
    <button v-if="!adding" class="sc-btn sc-btn-primary" @click="adding = true"><PhPlus :size="20" />{{ t('calendar.add') }}</button>
    <form v-else class="sc-card pad stack sc-sheet" @submit.prevent="add">
      <label class="field">{{ t('calendar.what') }}<input v-model="form.title" class="sc-input" required maxlength="120" /></label>
      <div class="row" role="group" :aria-label="t('calendar.kind')">
        <button v-for="k in kinds" :key="k" type="button" class="sc-chip" :aria-pressed="form.kind === k" @click="form.kind = k">{{ t(`calendar.kinds.${k}`) }}</button>
      </div>
      <div class="grid-2">
        <label class="field">{{ t('calendar.date') }}<input v-model="form.date" class="sc-input" type="date" required /></label>
        <label class="field">{{ t('calendar.time') }}<input v-model="form.time" class="sc-input" type="time" required /></label>
      </div>
      <label class="field">{{ t('calendar.who') }}
        <select v-model="form.assigned_to" class="sc-input">
          <option value="">{{ t('calendar.nobody') }}</option>
          <option v-for="m in cal.data.value?.team ?? []" :key="m.id" :value="m.id">{{ m.display_name }} · {{ t(`roles.${m.relation === 'patient' ? 'patient' : m.relation}`) }}</option>
        </select>
      </label>
      <label class="field">{{ t('calendar.remind') }}
        <select v-model="form.remind" class="sc-input">
          <option value="">{{ t('calendar.remindNone') }}</option>
          <option v-for="m in leads" :key="m" :value="String(m)">{{ t(`calendar.remindOptions.${m}`) }}</option>
        </select>
      </label>
      <label class="field">{{ t('calendar.where') }}<input v-model="form.location" class="sc-input" maxlength="120" /></label>
      <label class="field">{{ t('common.noteOptional') }}<input v-model="form.notes" class="sc-input" maxlength="500" /></label>
      <div class="grid-2"><button type="button" class="sc-btn sc-btn-ghost" @click="adding = false">{{ t('common.cancel') }}</button><button class="sc-btn sc-btn-primary">{{ t('common.save') }}</button></div>
    </form>

    <EmptyState v-if="cal.data.value && !cal.data.value.results.length" :text="t('calendar.empty')" />
    <section v-for="(events, day) in byDay" :key="day" class="stack-s">
      <h2 class="sc-eyebrow" style="font-size: 0.85rem">{{ day }}</h2>
      <div v-for="e in events" :key="e.id" class="sc-card list-row" :style="{ opacity: e.is_done ? 0.6 : 1 }">
        <span class="sc-iconbox" style="width: 2.75rem; height: 2.75rem"><PhCalendarCheck :size="22" weight="duotone" /></span>
        <span class="stack-s" style="flex-grow: 1">
          <strong>{{ new Date(e.starts_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) }} · {{ e.title }}</strong>
          <span class="small muted">{{ t(`calendar.kinds.${e.kind}`) }}<template v-if="e.location"> · {{ e.location }}</template><template v-if="e.assigned_to_name"> · {{ e.assigned_to_name }}</template><template v-if="e.remind_minutes_before"> · {{ t('calendar.reminderSet', { when: t(`calendar.remindOptions.${e.remind_minutes_before}`) }) }}</template></span>
        </span>
        <button class="tick" style="width: 2.5rem; height: 2.5rem" :aria-pressed="e.is_done" :aria-label="t('calendar.done')" @click="toggle(e)"><PhCheck v-if="e.is_done" :size="18" weight="bold" /></button>
        <button class="icon-btn" :aria-label="t('common.delete')" @click="remove(e)"><PhTrash :size="18" /></button>
      </div>
    </section>

    <section class="stack">
      <h2>{{ t('calendar.handover') }}</h2>
      <form class="row" style="flex-wrap: nowrap" @submit.prevent="addNote">
        <label class="visually-hidden" for="ho">{{ t('calendar.handoverWrite') }}</label>
        <input id="ho" v-model="note" class="sc-input" :placeholder="t('calendar.handoverWrite')" maxlength="1000" />
        <button class="sc-btn sc-btn-primary" style="width: 3.5rem; padding: 0" :aria-label="t('calendar.handoverAdd')"><PhPlus :size="22" /></button>
      </form>
      <div v-for="n in notes.data.value?.results ?? []" :key="n.id" class="sc-card pad stack-s">
        <p>{{ n.text }}</p><span class="tiny">{{ n.author_name }} · {{ new Date(n.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) }}</span>
      </div>
    </section>
  </main>
</template>
