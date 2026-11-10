<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhPlay, PhTrash } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import { toast } from '@/composables/useToast'

const props = defineProps<{ base: string; notes: any[]; canDelete?: boolean }>()
const emit = defineEmits<{ changed: [] }>()
const { t } = useI18n()
const urls = ref<Record<string, string>>({})

async function play(id: string) {
  try {
    urls.value[id] ??= URL.createObjectURL(await api.blob(`${props.base}/voice-notes/${id}/`))
  } catch (e) {
    toast(errorText(e))
  }
}
async function remove(id: string) {
  try {
    await api.del(`${props.base}/voice-notes/${id}/`)
    emit('changed')
  } catch (e) {
    toast(errorText(e))
  }
}
</script>

<template>
  <ul class="list">
    <li v-for="n in notes" :key="n.id" class="sc-card list-row">
      <div class="stack-s" style="flex-grow: 1">
        <strong>{{ t('voice.note') }} · {{ n.duration_seconds ?? '?' }} s</strong>
        <span class="tiny">{{ n.recorded_by_name }} · {{ new Date(n.created_at).toLocaleString() }}</span>
        <audio v-if="urls[n.id]" :src="urls[n.id]" controls autoplay style="width: 100%"></audio>
      </div>
      <button v-if="!urls[n.id]" class="icon-btn" :aria-label="t('voice.play')" @click="play(n.id)"><PhPlay :size="22" weight="fill" /></button>
      <button v-if="canDelete" class="icon-btn" :aria-label="t('common.delete')" @click="remove(n.id)"><PhTrash :size="20" /></button>
    </li>
  </ul>
</template>
