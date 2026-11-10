<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     For people who find speaking hard. Tap a tile: the words fill the screen and the phone says them,
     using its own voice for the language when it has one. Everyday needs only. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PhBed, PhChatCircleText, PhCheck, PhDrop, PhForkKnife, PhHandHeart, PhHandPalm, PhHandWaving, PhHourglass, PhMoon,
  PhPhoneCall, PhQuestion, PhSmileySad, PhSpeakerHigh, PhThermometerCold, PhThermometerHot, PhToilet, PhUsersThree, PhX,
} from '@phosphor-icons/vue'

import { api } from '@/api/client'
import DraftNote from '@/components/DraftNote.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { useSpeech } from '@/composables/useSpeech'

const { t, locale } = useI18n()
const { data } = useLoader(() => api.get('/talk-board/', { lang: locale.value }))
const { canSpeak, speak } = useSpeech()
const tab = ref('needs')
const shown = ref<any | null>(null)
const tabs = ['needs', 'feelings', 'answers', 'people']
const tiles = computed(() => (data.value?.results ?? []).filter((p: any) => p.category === tab.value))

// Only the icons the phrases use, so the app stays small on slow connections.
const ICONS: Record<string, unknown> = {
  check: PhCheck, x: PhX, hourglass: PhHourglass, question: PhQuestion, 'hand-heart': PhHandHeart, drop: PhDrop,
  'fork-knife': PhForkKnife, toilet: PhToilet, bed: PhBed, 'hand-waving': PhHandWaving, 'hand-palm': PhHandPalm,
  moon: PhMoon, 'thermometer-cold': PhThermometerCold, 'thermometer-hot': PhThermometerHot, 'smiley-sad': PhSmileySad,
  'users-three': PhUsersThree, 'phone-call': PhPhoneCall,
}
const icon = (name: string) => ICONS[name] ?? PhChatCircleText
function say(p: any) {
  shown.value = p
  speak(p.label)
}
</script>

<template>
  <main class="page">
    <PageHeader :title="t('talk.title')" :subtitle="t('talk.lead')" />
    <div role="tablist" class="row">
      <button v-for="c in tabs" :key="c" role="tab" class="sc-chip" :aria-selected="tab === c" :aria-pressed="tab === c" @click="tab = c">{{ t(`talk.cat.${c}`) }}</button>
    </div>
    <div class="grid-2">
      <button v-for="(p, i) in tiles" :key="p.code" class="sc-card sc-rise pad stack" :style="{ animationDelay: `${Number(i) * 40}ms`, minHeight: '8.5rem', alignItems: 'flex-start', justifyContent: 'space-between', color: 'var(--ink)', cursor: 'pointer', textAlign: 'left' }" @click="say(p)">
        <span class="sc-iconbox" style="width: 3.75rem; height: 3.75rem"><component :is="icon(p.icon)" :size="36" weight="duotone" /></span>
        <span style="font-size: 1.2rem; font-weight: 800; line-height: 1.2">{{ p.label }}</span>
      </button>
    </div>
    <p class="tiny">{{ canSpeak ? t('talk.voiceOn') : t('talk.voiceOff') }}</p>
    <DraftNote />

    <Teleport to="body">
      <div v-if="shown" role="dialog" aria-modal="true" :aria-label="shown.label" class="sc-app sc-hero" style="position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.6rem; padding: 2rem; text-align: center">
        <span class="sc-glass sc-sheet" style="width: 8rem; height: 8rem; border-radius: 2.5rem; display: grid; place-items: center"><component :is="icon(shown.icon)" :size="76" weight="duotone" /></span>
        <span class="sc-sheet" style="font-size: 2.75rem; font-weight: 800; line-height: 1.1">{{ shown.label }}</span>
        <div class="row" style="justify-content: center">
          <button v-if="canSpeak" class="sc-btn sc-glass" style="color: var(--on-hero)" @click="speak(shown.label)"><PhSpeakerHigh :size="22" />{{ t('talk.again') }}</button>
          <button class="sc-btn" style="background: #fff; color: #312E81" @click="shown = null">{{ t('common.done') }}</button>
        </div>
      </div>
    </Teleport>
  </main>
</template>
