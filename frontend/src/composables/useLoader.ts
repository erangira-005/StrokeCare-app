// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
import { onMounted, ref, type Ref } from 'vue'

import { errorText } from '@/api/client'

/** Load data once on mount, with loading and error state, and a reload() for after changes. */
export function useLoader<T>(fn: () => Promise<T>, immediate = true) {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref('')
  async function reload() {
    loading.value = true
    error.value = ''
    try {
      data.value = await fn()
    } catch (e) {
      error.value = errorText(e)
    } finally {
      loading.value = false
    }
  }
  if (immediate) onMounted(reload)
  return { data, loading, error, reload }
}
