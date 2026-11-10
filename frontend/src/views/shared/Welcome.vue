<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhBookOpenText, PhChatCircleText, PhSignIn, PhUserPlus } from '@phosphor-icons/vue'

import { LOCALES, setLocale, type Locale } from '@/i18n'

const { t, locale } = useI18n()
</script>

<template>
  <main class="page">
    <section class="hero-head sc-hero">
      <div class="sc-rise stack-s">
        <h1 style="font-size: 2rem">{{ t('welcome.title') }}</h1>
        <p class="muted" style="font-size: 1.05rem">{{ t('welcome.lead') }}</p>
      </div>
      <div role="group" :aria-label="t('settings.language')" class="row">
        <button v-for="l in LOCALES" :key="l.code" class="sc-chip" :aria-pressed="locale === l.code" @click="setLocale(l.code as Locale)">{{ l.name }}</button>
      </div>
    </section>
    <div class="stack sc-rise" style="animation-delay: 80ms">
      <RouterLink to="/login" class="sc-btn sc-btn-primary"><PhSignIn :size="22" />{{ t('auth.signIn') }}</RouterLink>
      <RouterLink to="/register" class="sc-btn sc-btn-ghost"><PhUserPlus :size="22" />{{ t('auth.create') }}</RouterLink>
    </div>
    <div class="grid-2 sc-rise" style="animation-delay: 140ms">
      <RouterLink to="/talk" class="sc-card pad stack-s" style="text-decoration: none; color: var(--ink)">
        <span class="sc-iconbox"><PhChatCircleText :size="28" weight="duotone" /></span>
        <strong>{{ t('talk.title') }}</strong><span class="small muted">{{ t('talk.short') }}</span>
      </RouterLink>
      <RouterLink to="/learn" class="sc-card pad stack-s" style="text-decoration: none; color: var(--ink)">
        <span class="sc-iconbox sc-iconbox-accent"><PhBookOpenText :size="28" weight="duotone" /></span>
        <strong>{{ t('learn.title') }}</strong><span class="small muted">{{ t('learn.short') }}</span>
      </RouterLink>
    </div>
    <p class="tiny">{{ t('welcome.safety') }}</p>
  </main>
</template>
