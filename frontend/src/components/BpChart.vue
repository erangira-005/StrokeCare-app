<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rule: numbers only. One plain colour per line, no bands, no threshold lines, no red or green. -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'

const props = defineProps<{ readings: { taken_at: string; systolic: number; diastolic: number }[] }>()
const { t, locale } = useI18n()
const el = ref<HTMLDivElement>()
let chart: uPlot | null = null
let observer: ResizeObserver | null = null

function css(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#4338CA'
}
const dayLabel = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString(locale.value, { weekday: 'short', day: 'numeric' })

function draw() {
  if (!el.value) return
  chart?.destroy()
  const rows = [...props.readings].sort((a, b) => +new Date(a.taken_at) - +new Date(b.taken_at))
  const data: uPlot.AlignedData = [
    rows.map((r) => +new Date(r.taken_at) / 1000),
    rows.map((r) => r.systolic),
    rows.map((r) => r.diastolic),
  ]
  const ink = css('--ink-3')
  chart = new uPlot(
    {
      width: Math.max(240, el.value.clientWidth),
      height: 190,
      legend: { show: false },
      cursor: { drag: { x: false, y: false } },
      scales: { y: { range: (_u, min, max) => [Math.min(60, min - 5), Math.max(150, max + 5)] } },
      axes: [
        { stroke: ink, grid: { stroke: css('--line') }, ticks: { show: false }, space: 64, values: (_u, splits) => splits.map(dayLabel) },
        { stroke: ink, grid: { stroke: css('--line') }, ticks: { show: false }, size: 40 },
      ],
      series: [
        {},
        { label: t('bp.top'), stroke: css('--primary'), width: 3, points: { size: 6 } },
        { label: t('bp.bottom'), stroke: css('--accent-ink'), width: 3, dash: [6, 5], points: { size: 6 } },
      ],
    },
    data,
    el.value,
  )
}

onMounted(() => {
  draw()
  // Redraw at the card's real width (grids settle after the first paint, and phones rotate).
  observer = new ResizeObserver(() => chart && el.value && chart.setSize({ width: Math.max(240, el.value.clientWidth), height: 190 }))
  if (el.value) observer.observe(el.value)
})
watch(() => [props.readings, locale.value], draw)
onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.destroy()
})
</script>

<template>
  <figure style="margin: 0; overflow: hidden">
    <div ref="el" aria-hidden="true" style="width: 100%"></div>
    <figcaption class="row small muted" style="gap: 1rem; margin-top: 0.25rem">
      <span class="row" style="gap: 0.4rem"><svg width="18" height="4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="var(--primary)" stroke-width="3" /></svg>{{ t('bp.top') }}</span>
      <span class="row" style="gap: 0.4rem"><svg width="18" height="4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="var(--accent-ink)" stroke-width="3" stroke-dasharray="4 3" /></svg>{{ t('bp.bottom') }}</span>
      <span class="visually-hidden">
        <template v-for="r in readings" :key="r.taken_at">{{ new Date(r.taken_at).toLocaleString() }}: {{ r.systolic }} / {{ r.diastolic }} mmHg. </template>
      </span>
    </figcaption>
  </figure>
</template>
