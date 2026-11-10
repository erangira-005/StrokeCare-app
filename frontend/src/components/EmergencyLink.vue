<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rule: one tap from every screen. Red is used for this and nothing else. -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhSiren } from '@phosphor-icons/vue'
const { t } = useI18n()
</script>

<template>
  <RouterLink to="/emergency" class="sc-emergency"><PhSiren :size="20" weight="fill" />{{ t('emergency.button') }}</RouterLink>
</template>
