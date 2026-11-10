<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
     Safety rule: draft content always says so, and names its source when it has one. -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhInfo } from '@phosphor-icons/vue'
defineProps<{ source?: string; status?: string }>()
const { t } = useI18n()
</script>

<template>
  <span v-if="!status || status === 'draft'" class="sc-draft"><PhInfo :size="16" />{{ t('common.draft') }}<template v-if="source"> · {{ source }}</template></span>
  <span v-else class="sc-draft">{{ t('common.reviewed') }}</span>
</template>
