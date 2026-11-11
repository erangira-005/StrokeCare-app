<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Personal talk-board phrases: the words this person needs most, added by them or by family, in any language.
     They appear first on the talk board. These are the person's own words, not medical advice. -->
<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhBed, PhChatCircleText, PhDrop, PhForkKnife, PhHandHeart, PhPhoneCall, PhPlus, PhToilet, PhTrash, PhUsersThree } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { useSubject } from '@/composables/useSubject'
import { toast } from '@/composables/useToast'

const { t } = useI18n()
const { base, isSelf } = useSubject()
const phrases = useLoader(() => api.get(`${base.value}/phrases/`))
const form = reactive({ text: '', icon: 'chat-circle' })
// A short, friendly set of pictures. The server accepts these and a few more used by the built-in phrases.
const ICONS: Record<string, unknown> = {
  'chat-circle': PhChatCircleText, drop: PhDrop, 'fork-knife': PhForkKnife, toilet: PhToilet, bed: PhBed,
  'hand-heart': PhHandHeart, 'phone-call': PhPhoneCall, 'users-three': PhUsersThree,
}
const icon = (name: string) => ICONS[name] ?? PhChatCircleText

async function add() {
  if (!form.text.trim()) return
  try {
    await api.post(`${base.value}/phrases/`, { text: form.text, icon: form.icon })
    form.text = ''
    phrases.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
async function remove(p: any) {
  try {
    await api.del(`${base.value}/phrases/${p.id}/`)
    phrases.reload()
  } catch (e) {
    toast(errorText(e))
  }
}
</script>

<template>
  <main class="page">
    <PageHeader :title="isSelf ? t('phrases.title') : t('phrases.titleOther')" :subtitle="t('phrases.lead')" back />
    <form class="sc-card pad stack" @submit.prevent="add">
      <label class="field">{{ t('phrases.add') }}<input v-model="form.text" class="sc-input" maxlength="80" :placeholder="t('phrases.placeholder')" /></label>
      <strong>{{ t('phrases.picture') }}</strong>
      <div class="row" role="radiogroup" :aria-label="t('phrases.picture')">
        <button v-for="(_, name) in ICONS" :key="name" type="button" role="radio" class="sc-chip" :aria-checked="form.icon === name" :aria-pressed="form.icon === name" @click="form.icon = String(name)">
          <component :is="icon(String(name))" :size="20" />{{ t(`phrases.icons.${name}`) }}
        </button>
      </div>
      <button class="sc-btn sc-btn-primary" :disabled="!form.text.trim()"><PhPlus :size="20" />{{ t('phrases.add') }}</button>
    </form>
    <EmptyState v-if="phrases.data.value && !phrases.data.value.results.length" :text="t('phrases.none')" />
    <div v-for="p in phrases.data.value?.results ?? []" :key="p.id" class="sc-card list-row">
      <span class="sc-iconbox" style="width: 2.75rem; height: 2.75rem"><component :is="icon(p.icon)" :size="22" weight="duotone" /></span>
      <strong style="flex-grow: 1">{{ p.text }}</strong>
      <button class="icon-btn" :aria-label="t('common.delete')" @click="remove(p)"><PhTrash :size="18" /></button>
    </div>
  </main>
</template>
