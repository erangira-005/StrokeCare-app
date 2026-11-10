<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <p class="sc-card pad muted" style="text-align: center; box-shadow: none; border-style: dashed">{{ text }}</p>
</template>
