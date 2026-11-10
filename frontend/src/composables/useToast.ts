// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
import { ref } from 'vue'

export interface Toast {
  id: number
  text: string
}
export const toasts = ref<Toast[]>([])

export function toast(text: string, ms = 3500) {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, text })
  setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), ms)
}
