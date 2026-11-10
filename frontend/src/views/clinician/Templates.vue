<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCopy, PhTrash } from '@phosphor-icons/vue'

import { api, errorText } from '@/api/client'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useLoader } from '@/composables/useLoader'
import { toast } from '@/composables/useToast'

const { t } = useI18n()
const { data, reload } = useLoader(() => api.get('/plan-templates/'))
const form = reactive({ name: '', tasks: '' })

async function save() {
  try {
    const tasks = form.tasks.split('\n').map((l) => l.trim()).filter(Boolean).map((title) => ({ title }))
    await api.post('/plan-templates/', { name: form.name, tasks })
    Object.assign(form, { name: '', tasks: '' })
    reload()
  } catch (e) {
    toast(errorText(e))
  }
}
async function remove(id: string) {
  await api.del(`/plan-templates/${id}/`)
  reload()
}
</script>

<template>
  <main class="page page-wide">
    <PageHeader :title="t('templates.title')" :subtitle="t('templates.lead')" />
    <form class="sc-card pad stack" style="max-width: 40rem" @submit.prevent="save">
      <label class="field">{{ t('templates.name') }}<input v-model="form.name" class="sc-input" required maxlength="120" /></label>
      <label class="field">{{ t('templates.tasks') }}<textarea v-model="form.tasks" class="sc-input" rows="6" required></textarea><span class="tiny">{{ t('templates.oneLine') }}</span></label>
      <button class="sc-btn sc-btn-primary">{{ t('common.save') }}</button>
    </form>
    <EmptyState v-if="data && !data.results.length" :text="t('templates.empty')" />
    <div class="grid-auto">
      <div v-for="x in data?.results ?? []" :key="x.id" class="sc-card pad stack-s">
        <div class="row-between"><strong class="row"><PhCopy :size="20" />{{ x.name }}</strong>
          <button class="icon-btn" :aria-label="t('common.delete')" @click="remove(x.id)"><PhTrash :size="18" /></button></div>
        <ol class="small" style="margin: 0; padding-left: 1.2rem"><li v-for="(task, i) in x.tasks" :key="i">{{ task.title }}</li></ol>
      </div>
    </div>
  </main>
</template>
