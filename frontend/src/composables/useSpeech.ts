// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
// Reads text aloud with the phone's own voice. There are no recordings. If the phone has no voice for the chosen
// language (Kinyarwanda voices are rare), `canSpeak` is false and the screen shows the words large instead.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const voices = ref<SpeechSynthesisVoice[]>([])
const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
if (supported) {
  const load = () => (voices.value = window.speechSynthesis.getVoices())
  load()
  window.speechSynthesis.addEventListener?.('voiceschanged', load)
}

export function useSpeech() {
  const { locale } = useI18n()
  const voice = computed(() => voices.value.find((v) => v.lang.toLowerCase().startsWith(locale.value)) ?? null)
  const canSpeak = computed(() => supported && !!voice.value)
  const speaking = ref(false)

  function speak(text: string) {
    if (!canSpeak.value) return false
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice.value
    u.lang = voice.value!.lang
    u.rate = 0.9
    u.onstart = () => (speaking.value = true)
    u.onend = u.onerror = () => (speaking.value = false)
    window.speechSynthesis.speak(u)
    return true
  }
  function stop() {
    if (supported) window.speechSynthesis.cancel()
    speaking.value = false
  }
  return { canSpeak, speak, stop, speaking }
}
