<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     The answer buttons for one check-in question. Used one question at a time, or all on one screen. -->
<script setup lang="ts">
import { PhCheck, PhX } from '@phosphor-icons/vue'
import { useI18n } from 'vue-i18n'

type Answer = { value: unknown; skipped: boolean }
defineProps<{ q: any; modelValue?: Answer }>()
const emit = defineEmits<{ 'update:modelValue': [Answer] }>()
const { t } = useI18n()
const pick = (value: unknown) => emit('update:modelValue', { value, skipped: false })
</script>

<template>
  <div v-if="q.answer_type === 'yes_no'" class="grid-2">
    <button type="button" class="sc-card choice" :aria-pressed="modelValue?.value === true" @click="pick(true)"><PhCheck :size="40" weight="duotone" />{{ t('common.yes') }}</button>
    <button type="button" class="sc-card choice" :aria-pressed="modelValue?.value === false" @click="pick(false)"><PhX :size="40" weight="duotone" />{{ t('common.no') }}</button>
  </div>
  <div v-else-if="q.answer_type === 'choice'" class="stack">
    <button v-for="c in q.choices" :key="c.value" type="button" class="sc-card choice choice-row" :aria-pressed="modelValue?.value === c.value" @click="pick(c.value)">{{ c.label }}</button>
  </div>
  <div v-else-if="q.answer_type === 'scale_5'" class="row" style="flex-wrap: nowrap">
    <button v-for="n in 5" :key="n" type="button" class="sc-card choice" style="flex: 1; min-height: 4.5rem" :aria-pressed="modelValue?.value === n" @click="pick(n)">{{ n }}</button>
  </div>
  <label v-else class="field">{{ t('checkin.yourWords') }}
    <textarea class="sc-input" :value="(modelValue?.value as string) ?? ''" @input="pick(($event.target as HTMLTextAreaElement).value)"></textarea>
  </label>
</template>
