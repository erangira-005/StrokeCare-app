<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     One person's last days, for whoever they shared it with. Clinicians also write the plan and the medicine list here.
     Safety rule: counts, averages and their own words. The disclaimer is always shown. -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PhCalendarCheck, PhChartBar, PhChatCircleText, PhCheck, PhClipboardText, PhHeartbeat, PhInfo, PhMapPin, PhPersonSimpleWalk, PhPill,
  PhPrinter, PhTarget,
} from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import BpChart from '@/components/BpChart.vue'
import PhasesEditor from '@/components/PhasesEditor.vue'
import PageHeader from '@/components/PageHeader.vue'
import VoiceNotes from '@/components/VoiceNotes.vue'
import { useLoader } from '@/composables/useLoader'
import { byWho, useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'
import { useAuth } from '@/stores/auth'

const { t, locale } = useI18n()
const auth = useAuth()
const { base, ref: subjectRef, isSelf, link } = useSubject()
const days = ref(7)
const SELF = ['view_readings', 'view_plan', 'view_checkins', 'view_summary', 'view_meds', 'view_notes', 'message', 'view_calendar']
const access = useLoader(async () => {
  if (isSelf.value) return { display_name: auth.user?.display_name, scopes: SELF }
  return (await api.get('/patients/')).find((p: any) => p.patient_id === subjectRef.value) ?? { scopes: [] }
})
const can = (scope: string) => (access.data.value?.scopes ?? []).includes(scope)
const summary = useLoader(() => api.get(`${base.value}/summary/`, { days: days.value }))
const readings = useLoader(() => api.get(`${base.value}/readings/`, { limit: 60 }).catch(() => ({ results: [] })))
const plan = useLoader(() => api.get(`${base.value}/plan/`).catch(() => null))
const meds = useLoader(() => api.get(`${base.value}/medications/`, { include_inactive: 1 }).catch(() => null))
const questions = useLoader(() => api.get(`${base.value}/visit-questions/`).catch(() => ({ results: [] })))
const voice = useLoader(() => api.get(`${base.value}/voice-notes/`).catch(() => ({ results: [] })))
const visits = useLoader(() => api.get(`${base.value}/home-visits/`).catch(() => ({ results: [] })))
const questionText = useLoader(() => api.get('/checkin-questions/', { lang: locale.value }))
const labels = computed(() => {
  const map: Record<string, { prompt: string; choices: Record<string, string> }> = {}
  for (const q of questionText.data.value?.results ?? []) {
    map[q.code] = { prompt: q.prompt, choices: Object.fromEntries(q.choices.map((c: any) => [String(c.value), c.label])) }
  }
  return map
})
const answerLabel = (code: string, v: string) =>
  v === 'yes' ? t('common.yes') : v === 'no' ? t('common.no') : (labels.value[code]?.choices[v] ?? v)
const templates = useLoader(() => (auth.role === 'clinician' ? api.get('/plan-templates/') : Promise.resolve({ results: [] })))

const s = computed(() => summary.data.value)
const recent = computed(() => {
  const since = Date.now() - days.value * 86400000
  return (readings.data.value?.results ?? []).filter((r: any) => +new Date(r.taken_at) >= since)
})
function setDays(n: number) {
  days.value = n
  summary.reload()
}

const newTask = reactive({ title: '', instructions: '' })
const tpl = ref('')
const med = reactive({ name: '', dose: '', times: '08:00', instructions: '' })
async function run(fn: () => Promise<unknown>, after: () => void) {
  try {
    await fn()
    after()
  } catch (e) {
    toast(errorText(e))
  }
}
const addTask = () => run(() => api.post(`${base.value}/plan/tasks/`, newTask), () => { Object.assign(newTask, { title: '', instructions: '' }); plan.reload() })
const retireTask = (task: any) => run(() => api.patch(`${base.value}/plan/tasks/${task.id}/`, { is_active: false }), plan.reload)
const applyTemplate = () => run(() => api.post(`${base.value}/plan/apply-template/`, { template: tpl.value }), plan.reload)
const addMed = () =>
  run(
    () => api.post(`${base.value}/medications/`, { ...med, times: med.times.split(',').map((x) => x.trim()).filter(Boolean) }),
    () => { Object.assign(med, { name: '', dose: '', instructions: '' }); meds.reload() },
  )
const stopMed = (m: any) => run(() => api.patch(`${base.value}/medications/${m.id}/`, { is_active: !m.is_active }), meds.reload)
const discussed = (q: any) => run(() => api.patch(`${base.value}/visit-questions/${q.id}/`, { discussed: !q.discussed }), questions.reload)
const checklistLabel = (code: string) => t(`visitLog.items.${code}`)
const printPage = () => window.print()
</script>

<template>
  <main class="page page-wide">
    <PageHeader :title="access.data.value?.display_name ?? t('summary.title')" :subtitle="s ? `${s.period.from} → ${s.period.to}` : ''" back>
      <div class="row" style="margin-left: auto">
        <button v-for="n in [7, 14, 30]" :key="n" class="sc-chip" :aria-pressed="days === n" @click="setDays(n)">{{ t('summary.days', { n }) }}</button>
        <button class="sc-btn sc-btn-ghost" style="min-height: 2.75rem" @click="printPage"><PhPrinter :size="20" />{{ t('summary.print') }}</button>
      </div>
    </PageHeader>

    <p class="banner"><PhInfo :size="20" />{{ s?.disclaimer ?? t('summary.disclaimer') }}</p>
    <nav class="row" :aria-label="t('summary.title')">
      <RouterLink :to="link('recovery')" class="sc-chip" style="text-decoration: none"><PhTarget :size="18" />{{ t('recovery.titleOther') }}</RouterLink>
      <RouterLink :to="link('mobility')" class="sc-chip" style="text-decoration: none"><PhPersonSimpleWalk :size="18" />{{ t('mobility.title') }}</RouterLink>
      <RouterLink :to="link('progress')" class="sc-chip" style="text-decoration: none"><PhChartBar :size="18" />{{ t('progress.title') }}</RouterLink>
    </nav>
    <PhasesEditor v-if="can('manage_plan')" />
    <div class="row">
      <RouterLink v-if="can('message')" :to="link('messages')" class="sc-chip" style="text-decoration: none"><PhChatCircleText :size="18" />{{ t('messages.title') }}</RouterLink>
      <RouterLink v-if="can('view_calendar')" :to="link('calendar')" class="sc-chip" style="text-decoration: none"><PhCalendarCheck :size="18" />{{ t('calendar.title') }}</RouterLink>
      <RouterLink v-if="auth.role === 'chw'" :to="link('home-visit')" class="sc-chip" style="text-decoration: none"><PhMapPin :size="18" />{{ t('visitLog.record') }}</RouterLink>
    </div>

    <div v-if="s" class="grid-auto">
      <section class="sc-card pad stack-s sc-rise"><span class="row small muted"><PhHeartbeat :size="18" />{{ t('summary.readingsLabel') }}</span>
        <span class="big-number">{{ s.blood_pressure.readings }}</span><span class="small muted">{{ t('summary.onDays', { n: s.blood_pressure.days_with_a_reading, total: s.period.days }) }}</span></section>
      <section class="sc-card pad stack-s sc-rise"><span class="row small muted"><PhHeartbeat :size="18" />{{ t('summary.average') }}</span>
        <span class="big-number">{{ s.blood_pressure.average_systolic ?? '—' }} / {{ s.blood_pressure.average_diastolic ?? '—' }}</span><span class="small muted">mmHg</span></section>
      <section class="sc-card pad stack-s sc-rise"><span class="row small muted"><PhPill :size="18" />{{ t('summary.doses') }}</span>
        <span class="big-number">{{ s.medicines.doses_marked_taken }}<small class="muted" style="font-size: 1.1rem"> / {{ s.medicines.doses_due }}</small></span><span class="small muted">{{ t('summary.medsActive', { n: s.medicines.active }) }}</span></section>
      <section class="sc-card pad stack-s sc-rise"><span class="row small muted"><PhClipboardText :size="18" />{{ t('summary.checkins') }}</span>
        <span class="big-number">{{ s.daily_check_ins.submitted }}</span><span class="small muted">{{ t('summary.urgentDays', { n: s.daily_check_ins.days_urgent_question_answered_yes }) }}</span></section>
    </div>

    <div class="grid-auto" style="grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr))">
      <section class="sc-card pad stack-s"><h2>{{ t('bp.recent') }}</h2><BpChart v-if="recent.length > 1" :readings="recent" /><p v-else class="muted small">{{ t('bp.none') }}</p></section>
      <section v-if="s" class="sc-card pad stack">
        <h2>{{ t('summary.answers') }}</h2>
        <div v-for="q in s.daily_check_ins.by_question" :key="q.question" class="stack-s">
          <strong class="small">{{ labels[q.question]?.prompt ?? q.prompt }}</strong>
          <div v-for="(n, v) in q.value_counts" :key="v" style="display: grid; grid-template-columns: 10rem 1fr 2rem; gap: 0.5rem; align-items: center" class="small">
            <span>{{ answerLabel(q.question, String(v)) }}</span>
            <span :style="{ height: '0.6rem', borderRadius: '0.3rem', background: 'var(--primary)', width: `${(100 * (n as number)) / Math.max(1, q.answered)}%` }"></span><span>{{ n }}</span>
          </div>
          <span class="tiny">{{ t('summary.skipped', { n: q.skipped }) }}</span>
        </div>
      </section>
    </div>

    <div class="grid-auto" style="grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr))">
      <section class="sc-card pad stack">
        <h2>{{ t('summary.plan') }}</h2>
        <p v-if="!plan.data.value?.tasks?.length" class="muted small">{{ t('summary.noPlan') }}</p>
        <div v-for="task in plan.data.value?.tasks ?? []" :key="task.id" class="row-between" style="flex-wrap: nowrap">
          <span class="stack-s"><strong>{{ task.title }}</strong><span class="tiny">{{ task.done_today ? t('summary.doneToday') : '' }}</span></span>
          <button v-if="can('manage_plan')" class="sc-chip" @click="retireTask(task)">{{ t('summary.retire') }}</button>
        </div>
        <template v-if="can('manage_plan')">
          <form class="stack-s" @submit.prevent="addTask">
            <label class="field">{{ t('summary.newTask') }}<input v-model="newTask.title" class="sc-input" required maxlength="200" /></label>
            <label class="field">{{ t('summary.instructions') }}<textarea v-model="newTask.instructions" class="sc-input"></textarea></label>
            <button class="sc-btn sc-btn-primary">{{ t('summary.addTask') }}</button>
          </form>
          <form v-if="templates.data.value?.results?.length" class="row" style="flex-wrap: nowrap" @submit.prevent="applyTemplate">
            <select v-model="tpl" class="sc-input" required :aria-label="t('templates.use')"><option value="" disabled>{{ t('templates.use') }}</option><option v-for="x in templates.data.value.results" :key="x.id" :value="x.id">{{ x.name }} · {{ x.tasks.length }}</option></select>
            <button class="sc-btn sc-btn-ghost">{{ t('common.add') }}</button>
          </form>
        </template>
      </section>

      <section class="sc-card pad stack">
        <h2>{{ t('meds.title') }}</h2>
        <div v-for="m in meds.data.value?.medications ?? []" :key="m.id" class="row-between" style="flex-wrap: nowrap" :style="{ opacity: m.is_active ? 1 : 0.55 }">
          <span class="stack-s"><strong>{{ m.name }}</strong><span class="tiny">{{ m.dose }} · {{ m.times.map((x: string) => x.slice(0, 5)).join(', ') }}</span></span>
          <button v-if="can('manage_meds')" class="sc-chip" @click="stopMed(m)">{{ m.is_active ? t('summary.stopMed') : t('summary.restartMed') }}</button>
        </div>
        <form v-if="can('manage_meds')" class="stack-s" @submit.prevent="addMed">
          <label class="field">{{ t('summary.medName') }}<input v-model="med.name" class="sc-input" required maxlength="120" /></label>
          <div class="grid-2">
            <label class="field">{{ t('summary.medDose') }}<input v-model="med.dose" class="sc-input" maxlength="120" /></label>
            <label class="field">{{ t('summary.medTimes') }}<input v-model="med.times" class="sc-input" placeholder="08:00, 20:00" required /></label>
          </div>
          <button class="sc-btn sc-btn-primary">{{ t('summary.addMed') }}</button>
        </form>
      </section>

      <section class="sc-card pad stack">
        <h2>{{ t('visit.toAsk', { n: (questions.data.value?.results ?? []).filter((q: any) => !q.discussed).length }) }}</h2>
        <label v-for="q in questions.data.value?.results ?? []" :key="q.id" class="check"><input type="checkbox" :checked="q.discussed" @change="discussed(q)" />
          <span><span :style="{ textDecoration: q.discussed ? 'line-through' : 'none' }">{{ q.text }}</span><br /><span class="tiny">{{ t(`roles.by.${byWho(q.entered_by_role, isSelf)}`) }}</span></span></label>
        <h3 v-if="voice.data.value?.results?.length">{{ t('voice.notes') }}</h3>
        <VoiceNotes :base="base" :notes="voice.data.value?.results ?? []" />
      </section>

      <section v-if="s" class="sc-card pad stack">
        <h2>{{ t('summary.ownWords') }}</h2>
        <p v-if="!s.notes_in_their_own_words.length" class="muted small">{{ t('summary.noNotes') }}</p>
        <blockquote v-for="n in s.notes_in_their_own_words" :key="n.at + n.text" style="margin: 0; padding: 0.6rem 0.9rem; border-left: 3px solid var(--primary); background: var(--surface-2); border-radius: 0 0.75rem 0.75rem 0">
          “{{ n.text }}”<br /><span class="tiny">{{ new Date(n.at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) }}</span></blockquote>
      </section>

      <section v-if="visits.data.value?.results?.length" class="sc-card pad stack">
        <h2>{{ t('visitLog.recent') }}</h2>
        <div v-for="v in visits.data.value.results" :key="v.id" class="stack-s">
          <strong>{{ new Date(v.visited_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) }} · {{ v.chw_name }}</strong>
          <span class="small"><span v-for="(on, code) in v.checklist" :key="code"><template v-if="on"><PhCheck :size="14" /> {{ checklistLabel(String(code)) }} </template></span></span>
          <span v-if="v.reading" class="small">{{ v.reading.systolic }} / {{ v.reading.diastolic }} mmHg</span>
          <span v-if="v.note" class="small muted">{{ v.note }}</span>
        </div>
      </section>
    </div>
  </main>
</template>
