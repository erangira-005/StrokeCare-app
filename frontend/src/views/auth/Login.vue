<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { PhHeartbeat } from '@phosphor-icons/vue'

import { errorText } from '@/api/client'
import { useAuth } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuth()
const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.replace(auth.needsConsent ? '/consent' : String(route.query.next ?? auth.home))
  } catch (e) {
    error.value = errorText(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="page" style="max-width: 28rem; padding-top: 2.5rem">
    <span class="brand-mark sc-pop" style="width: 3.5rem; height: 3.5rem; border-radius: 1.1rem"><PhHeartbeat :size="32" weight="duotone" /></span>
    <h1>{{ t('auth.signIn') }}</h1>
    <form class="stack" @submit.prevent="submit">
      <label class="field">{{ t('auth.email') }}<input v-model="email" class="sc-input" type="email" autocomplete="email" required /></label>
      <label class="field">{{ t('auth.password') }}<input v-model="password" class="sc-input" type="password" autocomplete="current-password" required /></label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="sc-btn sc-btn-primary" :disabled="busy">{{ t('auth.signIn') }}</button>
    </form>
    <p class="muted">{{ t('auth.noAccount') }} <RouterLink to="/register">{{ t('auth.create') }}</RouterLink></p>
    <RouterLink to="/emergency" class="sc-emergency" style="align-self: flex-start">{{ t('emergency.button') }}</RouterLink>
  </main>
</template>
