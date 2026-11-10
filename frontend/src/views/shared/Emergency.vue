<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rules: says to contact local emergency services and not to wait for the app; shows ONLY verified numbers. -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhCheckCircle, PhPhoneCall, PhSiren } from '@phosphor-icons/vue'

import { api } from '@/api/client'
import { useLoader } from '@/composables/useLoader'

const { t } = useI18n()
const { data } = useLoader(() => api.get('/emergency/'))
</script>

<template>
  <main class="page">
    <section class="hero-head" style="background: var(--danger); color: var(--on-danger)">
      <span class="sc-pop" style="width: 4.5rem; height: 4.5rem; border-radius: 1.5rem; display: grid; place-items: center; background: rgba(255,255,255,.16)"><PhSiren :size="44" weight="duotone" /></span>
      <h1 style="font-size: 2rem">{{ t('emergency.title') }}</h1>
      <p style="font-size: 1.3rem; font-weight: 700; line-height: 1.4">{{ data?.message ?? t('emergency.fallback') }}</p>
    </section>
    <section v-if="data?.contacts?.length" class="stack">
      <a v-for="c in data.contacts" :key="c.id" :href="`tel:${c.phone}`" class="sc-card pad row" style="text-decoration: none; color: var(--ink)">
        <span class="sc-iconbox"><PhPhoneCall :size="26" weight="duotone" /></span>
        <span class="stack-s" style="flex-grow: 1">
          <strong style="font-size: 1.15rem">{{ c.label }}</strong>
          <span>{{ c.phone }}<template v-if="c.hours"> · {{ c.hours }}</template></span>
          <span class="tiny row" style="gap: 0.3rem"><PhCheckCircle :size="16" weight="fill" />{{ t('emergency.verifiedBy', { name: c.verified_by }) }}</span>
        </span>
        <span class="sc-btn sc-btn-danger" style="min-height: 3rem">{{ t('emergency.call') }}</span>
      </a>
    </section>
    <section v-else class="sc-card pad row" style="align-items: flex-start">
      <span class="sc-iconbox"><PhPhoneCall :size="26" weight="duotone" /></span>
      <div class="stack-s">
        <h2>{{ t('emergency.numbers') }}</h2>
        <p class="muted">{{ t('emergency.noVerified') }}</p>
      </div>
    </section>
  </main>
</template>
