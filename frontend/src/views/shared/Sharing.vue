<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     The patient decides who sees what, and can end any link. Clinicians, caregivers and community health
     workers enter the code the patient gives them. -->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhKey, PhLinkBreak, PhShareNetwork } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { toast } from '@/composables/useToast'
import { useAuth } from '@/stores/auth'

const { t, locale } = useI18n()
const auth = useAuth()
const links = useLoader(() => api.get('/links/'))
const relation = ref('caregiver')
const label = ref('')
const created = ref<any>(null)
const code = ref('')
const error = ref('')

async function invite() {
  error.value = ''
  try {
    created.value = await api.post('/links/invite/', { relation: relation.value, label: label.value })
    links.reload()
  } catch (e) {
    error.value = errorText(e)
  }
}
async function redeem() {
  error.value = ''
  try {
    await api.post('/links/redeem/', { code: code.value })
    code.value = ''
    toast(t('sharing.linked'))
    links.reload()
  } catch (e) {
    error.value = errorText(e)
  }
}
async function end(id: string) {
  if (!confirm(t('sharing.confirmEnd'))) return
  await api.del(`/links/${id}/`)
  links.reload()
}
</script>

<template>
  <main class="page">
    <PageHeader :title="t('sharing.title')" :subtitle="auth.isPatient ? t('sharing.leadPatient') : t('sharing.leadMember')" back />

    <form v-if="auth.isPatient" class="sc-card pad stack" @submit.prevent="invite">
      <h2 class="row"><PhShareNetwork :size="24" weight="duotone" />{{ t('sharing.invite') }}</h2>
      <div class="row" role="group" :aria-label="t('sharing.who')">
        <button v-for="r in ['caregiver', 'clinician', 'chw']" :key="r" type="button" class="sc-chip" :aria-pressed="relation === r" @click="relation = r">{{ t(`roles.${r}`) }}</button>
      </div>
      <label class="field">{{ t('sharing.label') }}<input v-model="label" class="sc-input" maxlength="80" :placeholder="t('sharing.labelHint')" /></label>
      <p class="small muted">{{ t(`sharing.scopes.${relation}`) }}</p>
      <p class="small muted">{{ t(`sharing.more.${relation}`) }}</p>
      <button class="sc-btn sc-btn-primary">{{ t('sharing.makeCode') }}</button>
      <div v-if="created" class="sc-card pad stack-s sc-sheet" style="text-align: center; background: var(--primary-soft)">
        <span class="small muted">{{ t('sharing.codeFor', { who: t(`roles.${created.relation}`) }) }}</span>
        <strong style="font-size: 2.4rem; letter-spacing: 0.12em">{{ created.code }}</strong>
        <span class="tiny">{{ t('sharing.expires', { when: new Date(created.invite_expires_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) }) }}</span>
      </div>
    </form>

    <form v-else class="sc-card pad stack" @submit.prevent="redeem">
      <h2 class="row"><PhKey :size="24" weight="duotone" />{{ t('sharing.enterCode') }}</h2>
      <input v-model="code" class="sc-input" placeholder="ABCD-EFGH" autocapitalize="characters" style="font-size: 1.6rem; letter-spacing: 0.1em" />
      <button class="sc-btn sc-btn-primary">{{ t('sharing.link') }}</button>
    </form>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <h2>{{ t('sharing.current') }}</h2>
    <EmptyState v-if="links.data.value && !links.data.value.length" :text="t('sharing.none')" />
    <ul class="list">
      <li v-for="l in links.data.value ?? []" :key="l.id" class="sc-card list-row">
        <span class="stack-s" style="flex-grow: 1">
          <strong>{{ l.other_party?.display_name ?? l.label ?? t('sharing.waiting') }}</strong>
          <span class="small muted">{{ t(`roles.${l.relation}`) }} · {{ t(`sharing.status.${l.status}`) }}</span>
        </span>
        <button class="sc-btn sc-btn-ghost" style="min-height: 2.75rem" @click="end(l.id)"><PhLinkBreak :size="18" />{{ t('sharing.end') }}</button>
      </li>
    </ul>
  </main>
</template>
