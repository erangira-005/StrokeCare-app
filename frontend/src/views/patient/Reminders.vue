<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Reminders and what is coming up, including appointments from the care calendar. Reminders show inside the app.
     Phone alerts (SMS, push) are not built yet and the screen says so. -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhBellRinging, PhCalendarCheck, PhPlus, PhTrash } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { toast } from '@/composables/useToast'

const { t, locale } = useI18n()
const list = useLoader(() => api.get('/me/reminders/'))
const upcoming = useLoader(() => api.get('/me/reminders/upcoming/'))
const kinds = ['tasks', 'blood_pressure', 'checkin', 'medicines', 'mobility']
const adding = ref(false)
const form = reactive({ kind: 'checkin', time: '08:00', days: [0, 1, 2, 3, 4, 5, 6] as number[] })
// Monday is 0, as the server counts. 1 January 2024 was a Monday.
const dayName = (i: number) => new Date(2024, 0, 1 + i).toLocaleDateString(locale.value, { weekday: 'short' })
const when = (iso: string) => new Date(iso).toLocaleString(locale.value, { weekday: 'short', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
const daysText = (r: any) => (r.days_of_week.length === 7 ? t('reminders.everyDay') : r.days_of_week.map(dayName).join(', '))
const reload = () => {
  list.reload()
  upcoming.reload()
}

function toggleDay(i: number) {
  form.days = form.days.includes(i) ? form.days.filter((d) => d !== i) : [...form.days, i].sort()
}
async function add() {
  try {
    await api.post('/me/reminders/', { kind: form.kind, time_of_day: form.time, days_of_week: form.days })
    adding.value = false
    reload()
  } catch (e) {
    toast(errorText(e))
  }
}
async function toggle(r: any) {
  try {
    await api.patch(`/me/reminders/${r.id}/`, { is_active: !r.is_active })
    reload()
  } catch (e) {
    toast(errorText(e))
  }
}
async function remove(r: any) {
  try {
    await api.del(`/me/reminders/${r.id}/`)
    reload()
  } catch (e) {
    toast(errorText(e))
  }
}
</script>

<template>
  <main class="page">
    <PageHeader :title="t('reminders.title')" :subtitle="t('reminders.lead')" back />

    <section class="stack-s">
      <h2>{{ t('reminders.upcoming') }}</h2>
      <EmptyState v-if="upcoming.data.value && !upcoming.data.value.results.length" :text="t('reminders.none')" />
      <div v-for="u in upcoming.data.value?.results ?? []" :key="u.id" class="sc-card list-row">
        <span class="sc-iconbox" style="width: 2.75rem; height: 2.75rem"><component :is="u.kind === 'appointment' ? PhCalendarCheck : PhBellRinging" :size="22" weight="duotone" /></span>
        <span class="stack-s">
          <strong>{{ u.kind === 'appointment' ? u.title : t(`reminders.kinds.${u.kind}`) }}</strong>
          <span class="small muted">{{ when(u.next_at) }}<template v-if="u.location"> · {{ u.location }}</template></span>
        </span>
      </div>
    </section>

    <button v-if="!adding" class="sc-btn sc-btn-primary" @click="adding = true"><PhPlus :size="20" />{{ t('reminders.add') }}</button>
    <form v-else class="sc-card pad stack sc-sheet" @submit.prevent="add">
      <strong>{{ t('reminders.kind') }}</strong>
      <div class="row" role="group" :aria-label="t('reminders.kind')">
        <button v-for="k in kinds" :key="k" type="button" class="sc-chip" :aria-pressed="form.kind === k" @click="form.kind = k">{{ t(`reminders.kinds.${k}`) }}</button>
      </div>
      <label class="field">{{ t('reminders.at') }}<input v-model="form.time" class="sc-input" type="time" required /></label>
      <strong>{{ t('reminders.days') }}</strong>
      <div class="row" role="group" :aria-label="t('reminders.days')">
        <button v-for="i in 7" :key="i" type="button" class="sc-chip" :aria-pressed="form.days.includes(i - 1)" @click="toggleDay(i - 1)">{{ dayName(i - 1) }}</button>
      </div>
      <div class="grid-2"><button type="button" class="sc-btn sc-btn-ghost" @click="adding = false">{{ t('common.cancel') }}</button><button class="sc-btn sc-btn-primary" :disabled="!form.days.length">{{ t('common.save') }}</button></div>
    </form>

    <section class="stack-s">
      <div v-for="r in list.data.value?.results ?? []" :key="r.id" class="sc-card list-row" :style="{ opacity: r.is_active ? 1 : 0.6 }">
        <span class="stack-s" style="flex-grow: 1">
          <strong>{{ t(`reminders.kinds.${r.kind}`) }} · {{ String(r.time_of_day).slice(0, 5) }}</strong>
          <span class="small muted">{{ daysText(r) }}</span>
        </span>
        <button class="sc-chip" :aria-pressed="r.is_active" @click="toggle(r)">{{ r.is_active ? t('reminders.active') : t('reminders.inactive') }}</button>
        <button class="icon-btn" :aria-label="t('common.delete')" @click="remove(r)"><PhTrash :size="18" /></button>
      </div>
    </section>
  </main>
</template>
