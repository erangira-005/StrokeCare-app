<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Anyone can join as a survivor, a prevention user or a caregiver. Clinicians and community health workers
     are added by an administrator after their licence is checked. -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { ApiError, errorText } from '@/api/client'
import { LOCALES } from '@/i18n'
import { useAuth } from '@/stores/auth'

const { t, locale } = useI18n()
const auth = useAuth()
const router = useRouter()
const form = reactive({ display_name: '', email: '', password: '', role: 'survivor', preferred_language: locale.value })
const fields = ref<Record<string, string[]>>({})
const error = ref('')

async function submit() {
  error.value = ''
  fields.value = {}
  try {
    await auth.register({ ...form, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Kigali' })
    router.replace('/consent')
  } catch (e) {
    if (e instanceof ApiError) fields.value = e.fields
    error.value = errorText(e)
  }
}
</script>

<template>
  <main class="page" style="max-width: 30rem; padding-top: 2rem">
    <h1>{{ t('auth.create') }}</h1>
    <form class="stack" @submit.prevent="submit">
      <fieldset class="stack-s" style="border: 0; padding: 0; margin: 0">
        <legend class="field" style="margin-bottom: 0.4rem">{{ t('auth.iAm') }}</legend>
        <label v-for="r in ['survivor', 'prevention', 'caregiver']" :key="r" class="sc-card check pad" style="box-shadow: none">
          <input v-model="form.role" type="radio" name="role" :value="r" />
          <span class="stack-s"><strong>{{ t(`roles.${r}`) }}</strong><span class="small muted">{{ t(`roles.${r}Hint`) }}</span></span>
        </label>
      </fieldset>
      <label class="field">{{ t('auth.name') }}<input v-model="form.display_name" class="sc-input" autocomplete="name" required /></label>
      <label class="field">{{ t('auth.email') }}<input v-model="form.email" class="sc-input" type="email" autocomplete="email" required />
        <span v-if="fields.email" class="error">{{ fields.email[0] }}</span></label>
      <label class="field">{{ t('auth.password') }}<input v-model="form.password" class="sc-input" type="password" autocomplete="new-password" required />
        <span class="tiny">{{ t('auth.passwordHint') }}</span><span v-if="fields.password" class="error">{{ fields.password[0] }}</span></label>
      <label class="field">{{ t('settings.language') }}
        <select v-model="form.preferred_language" class="sc-input"><option v-for="l in LOCALES" :key="l.code" :value="l.code">{{ l.name }}</option></select></label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="sc-btn sc-btn-primary">{{ t('auth.create') }}</button>
    </form>
    <p class="muted">{{ t('auth.haveAccount') }} <RouterLink to="/login">{{ t('auth.signIn') }}</RouterLink></p>
  </main>
</template>
