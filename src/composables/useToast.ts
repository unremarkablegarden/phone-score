import { ref } from 'vue'

export type Tone = 'info' | 'error'

const message = ref('')
const tone = ref<Tone>('info')
let timer: ReturnType<typeof setTimeout> | undefined

export function useToast() {
  function toast(text: string, kind: Tone = 'info') {
    message.value = text
    tone.value = kind
    clearTimeout(timer)
    timer = setTimeout(() => (message.value = ''), 2600)
  }

  return { message, tone, toast }
}
