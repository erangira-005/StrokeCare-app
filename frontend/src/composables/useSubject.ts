// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
// Whose record a screen shows: `me` for the person themselves, or the id of someone who shared with you.
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export function useSubject() {
  const route = useRoute()
  const ref = computed(() => String(route.params.ref ?? 'me'))
  const base = computed(() => `/patients/${ref.value}`)
  const isSelf = computed(() => ref.value === 'me')
  const link = (page: string) => `/p/${ref.value}/${page}`
  return { ref, base, isSelf, link }
}

/** Key under roles.by.* for "who entered this", from the viewer's side: "you" on your own record, "the patient"
 *  for the patient's entries when someone else looks, otherwise the enterer's role. */
export function byWho(role: string | null | undefined, isSelf: boolean): string {
  if (!role) return isSelf ? 'self' : 'patient'
  if (role === 'survivor' || role === 'prevention') return isSelf ? 'self' : 'patient'
  return role
}
