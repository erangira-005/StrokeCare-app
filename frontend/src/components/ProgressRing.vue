<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Shows how much of today is done. It is a count, never a score, and it never shames. -->
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ done: number; total: number }>()
const C = 2 * Math.PI * 42
const offset = computed(() => (props.total ? C * (1 - props.done / props.total) : C))
</script>

<template>
  <div style="position: relative; width: 6rem; height: 6rem; flex-shrink: 0">
    <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden="true">
      <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="8" />
      <circle class="sc-ring" cx="48" cy="48" r="42" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"
        :stroke-dasharray="C" :style="{ strokeDashoffset: offset, transition: 'stroke-dashoffset .6s cubic-bezier(.2,.7,.2,1)' }"
        transform="rotate(-90 48 48)" />
    </svg>
    <span style="position: absolute; inset: 0; display: grid; place-items: center; font-weight: 800; font-size: 1.5rem; white-space: nowrap">
      {{ done }}<small style="font-size: 0.9rem; opacity: 0.85">/{{ total }}</small>
    </span>
  </div>
</template>
