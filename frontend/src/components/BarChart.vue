<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Plain bars: one per day, one colour. Safety rule: counts only. No target line, no colour that means good or bad,
     and an empty day is just an empty bar. The same numbers are always available as a table next to it. -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ days: { date: string; value: number }[]; label: string }>()
const { locale } = useI18n()

const W = 340 // about the width of a phone screen, so the labels stay readable instead of shrinking
const H = 150
const PAD = { top: 12, right: 8, bottom: 26, left: 30 }
const max = computed(() => Math.max(1, ...props.days.map((d) => d.value)))
const step = computed(() => (W - PAD.left - PAD.right) / Math.max(1, props.days.length))
const bars = computed(() =>
  props.days.map((d, i) => {
    const h = (d.value / max.value) * (H - PAD.top - PAD.bottom)
    return { x: PAD.left + i * step.value + step.value * 0.18, w: step.value * 0.64, h, y: H - PAD.bottom - h, d }
  }),
)
const every = computed(() => Math.ceil(props.days.length / 6))
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale.value, { day: 'numeric', month: 'numeric' })
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="label" style="width: 100%; height: auto; display: block">
    <line :x1="PAD.left" :x2="W - PAD.right" :y1="H - PAD.bottom" :y2="H - PAD.bottom" stroke="var(--line-strong)" />
    <text :x="PAD.left - 6" :y="PAD.top + 4" text-anchor="end" font-size="11" fill="var(--ink-2)">{{ max }}</text>
    <text :x="PAD.left - 6" :y="H - PAD.bottom" text-anchor="end" font-size="11" fill="var(--ink-2)">0</text>
    <g v-for="(b, i) in bars" :key="b.d.date">
      <rect :x="b.x" :y="b.d.value ? b.y : H - PAD.bottom - 1.5" :width="b.w" :height="b.d.value ? b.h : 1.5" rx="3" fill="var(--primary)" :opacity="b.d.value ? 1 : 0.35" />
      <text v-if="i % every === 0" :x="b.x + b.w / 2" :y="H - 8" text-anchor="middle" font-size="11" fill="var(--ink-2)">{{ dayLabel(b.d.date) }}</text>
    </g>
  </svg>
</template>
