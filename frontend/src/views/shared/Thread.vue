<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rule: messages are not for emergencies; the notice sits above the message box. -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhInfo, PhPaperPlaneRight } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t, locale } = useI18n()
const { base } = useSubject()
const messages = ref<any[]>([])
const notice = ref('')
const draft = ref('')
const list = ref<HTMLElement>()
let timer: number | undefined

async function load() {
  try {
    const r = await api.get(`${base.value}/messages/`)
    const grew = r.results.length !== messages.value.length
    messages.value = r.results
    notice.value = r.notice
    await api.post(`${base.value}/messages/read/`)
    if (grew) nextTick(() => list.value?.lastElementChild?.scrollIntoView({ block: 'end' }))
  } catch (e) {
    toast(errorText(e))
  }
}
async function send() {
  if (!draft.value.trim()) return
  try {
    await api.post(`${base.value}/messages/`, { body: draft.value })
    draft.value = ''
    load()
  } catch (e) {
    toast(errorText(e))
  }
}
onMounted(() => {
  load()
  timer = window.setInterval(load, 20000)
})
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <main class="page">
    <PageHeader :title="t('messages.title')" back />
    <p class="banner"><PhInfo :size="20" />{{ notice || t('messages.notice') }}</p>
    <EmptyState v-if="!messages.length" :text="t('messages.none')" />
    <ol ref="list" class="list" aria-live="polite">
      <li v-for="m in messages" :key="m.id" :style="{ alignSelf: m.mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }">
        <div class="sc-card pad" :style="m.mine ? { background: 'var(--primary)', color: 'var(--on-primary)', borderColor: 'var(--primary)' } : {}">
          <p style="white-space: pre-line">{{ m.body }}</p>
        </div>
        <p class="tiny" :style="{ textAlign: m.mine ? 'right' : 'left', marginTop: '0.25rem' }">
          {{ m.mine ? t('messages.you') : `${m.sender_name} · ${t(`roles.${m.sender_role}`)}` }} · {{ new Date(m.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) }}
        </p>
      </li>
    </ol>
    <form class="row thumb-actions" style="flex-wrap: nowrap; position: sticky; bottom: 5.75rem" @submit.prevent="send">
      <label class="visually-hidden" for="msg">{{ t('messages.write') }}</label>
      <textarea id="msg" v-model="draft" class="sc-input" :placeholder="t('messages.write')" maxlength="2000" rows="2" style="min-height: 3.5rem"></textarea>
      <button class="sc-btn sc-btn-primary" style="width: 3.5rem; padding: 0" :aria-label="t('messages.send')"><PhPaperPlaneRight :size="22" weight="fill" /></button>
    </form>
  </main>
</template>
