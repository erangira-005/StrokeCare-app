<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { toasts } from '@/composables/useToast'
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="page">
      <p v-for="t in toasts" :key="t.id" class="toast">{{ t.text }}</p>
    </TransitionGroup>
  </div>
</template>
