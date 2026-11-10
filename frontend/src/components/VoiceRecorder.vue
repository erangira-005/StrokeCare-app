<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Record a voice note instead of typing (aphasia, one hand, low literacy). Up to three minutes. -->
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhMicrophone, PhStop } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import { toast } from '@/composables/useToast'

const props = defineProps<{ base: string; context: 'visit' | 'check_in' | 'general' }>()
const emit = defineEmits<{ saved: [] }>()
const { t } = useI18n()
const recording = ref(false)
const seconds = ref(0)
const error = ref('')
let recorder: MediaRecorder | null = null
let timer: number | undefined
let chunks: Blob[] = []
const MAX = 180

function pickType() {
  for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(type)) return type
  }
  return ''
}

async function start() {
  error.value = ''
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const type = pickType()
    recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
    chunks = []
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    recorder.onstop = () => upload(stream)
    recorder.start()
    recording.value = true
    seconds.value = 0
    timer = window.setInterval(() => {
      seconds.value++
      if (seconds.value >= MAX) stop()
    }, 1000)
  } catch {
    error.value = t('voice.noMic')
  }
}

function stop() {
  window.clearInterval(timer)
  recording.value = false
  recorder?.state === 'recording' && recorder.stop()
}

async function upload(stream: MediaStream) {
  stream.getTracks().forEach((tr) => tr.stop())
  const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' })
  const form = new FormData()
  form.append('audio', blob, 'voice-note')
  form.append('duration_seconds', String(Math.max(1, seconds.value)))
  form.append('context', props.context)
  try {
    await api.upload(`${props.base}/voice-notes/`, form)
    toast(t('voice.saved'))
    emit('saved')
  } catch (e) {
    error.value = errorText(e)
  }
}

onBeforeUnmount(() => recording.value && stop())
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
</script>

<template>
  <div class="stack-s">
    <button v-if="!recording" class="sc-btn sc-btn-ghost" @click="start"><PhMicrophone :size="22" weight="duotone" />{{ t('voice.record') }}</button>
    <button v-else class="sc-btn sc-btn-primary" @click="stop">
      <PhStop :size="22" weight="fill" />{{ t('voice.stop') }} · {{ mmss(seconds) }}
      <span class="sc-wave" aria-hidden="true" style="display: inline-flex; gap: 3px; height: 18px; align-items: center">
        <span style="height: 10px"></span><span style="height: 18px; animation-delay: .1s"></span><span style="height: 12px; animation-delay: .2s"></span>
      </span>
    </button>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>
