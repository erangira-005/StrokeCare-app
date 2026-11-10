<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rule: no health data until the person agrees. The legal text is still a DRAFT (launch blocker 4),
     and the screen says so plainly. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { PhShieldCheck } from '@phosphor-icons/vue'

import { errorText } from '@/api/client'
import { useAuth } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuth()
const router = useRouter()
const ticked = ref<Record<string, boolean>>({})
const error = ref('')
const kinds = computed(() => Object.keys(auth.consents))
const ready = computed(() => kinds.value.every((k) => ticked.value[k] || auth.consents[k].granted))

async function accept() {
  try {
    for (const k of kinds.value) if (!auth.consents[k].granted) await auth.giveConsent(k)
    router.replace(auth.home)
  } catch (e) {
    error.value = errorText(e)
  }
}
</script>

<template>
  <main class="page" style="max-width: 34rem; padding-top: 2rem">
    <span class="sc-iconbox"><PhShieldCheck :size="28" weight="duotone" /></span>
    <h1>{{ t('consent.title') }}</h1>
    <p class="banner">{{ t('consent.draft') }}</p>
    <div v-for="k in kinds" :key="k" class="sc-card pad stack">
      <h2>{{ t(`consent.${k}.title`) }}</h2>
      <p class="muted">{{ t(`consent.${k}.body`) }}</p>
      <label v-if="!auth.consents[k].granted" class="check"><input v-model="ticked[k]" type="checkbox" />{{ t(`consent.${k}.agree`) }}</label>
      <p v-else class="small muted">{{ t('consent.given') }}</p>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <button class="sc-btn sc-btn-primary" :disabled="!ready" @click="accept">{{ t('consent.continue') }}</button>
    <button class="sc-btn sc-btn-ghost" @click="auth.logout().then(() => router.replace('/welcome'))">{{ t('auth.signOut') }}</button>
  </main>
</template>
