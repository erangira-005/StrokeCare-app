<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { PhCaretLeft } from '@phosphor-icons/vue'

defineProps<{ title: string; subtitle?: string; back?: boolean }>()
const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <div class="row sc-rise" style="align-items: flex-start; flex-wrap: nowrap">
    <button v-if="back" class="icon-btn" :aria-label="t('common.back')" @click="router.back()"><PhCaretLeft :size="22" /></button>
    <div class="stack-s" style="min-width: 0">
      <h1>{{ title }}</h1>
      <p v-if="subtitle" class="muted">{{ subtitle }}</p>
    </div>
    <slot />
  </div>
</template>
