import { onUnmounted, ref } from 'vue'

type WakeLockSentinel = { released: boolean; release(): Promise<void> }
type WakeLockNavigator = Navigator & {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinel> }
}

/**
 * Keeps the screen on during playback. Support is patchy (older iOS in
 * particular) and the browser can reject at will, so every call is guarded —
 * a failure here must never interrupt the score.
 */
export function useWakeLock() {
  const active = ref(false)
  const supported = 'wakeLock' in navigator
  let sentinel: WakeLockSentinel | null = null

  async function request() {
    if (!supported || sentinel) return
    try {
      sentinel = await (navigator as WakeLockNavigator).wakeLock!.request('screen')
      active.value = true
      // The browser drops the lock on its own when the page is hidden.
      ;(sentinel as unknown as EventTarget).addEventListener?.('release', () => {
        sentinel = null
        active.value = false
      })
    } catch {
      sentinel = null
      active.value = false
    }
  }

  async function release() {
    try {
      await sentinel?.release()
    } catch {
      /* ignore */
    }
    sentinel = null
    active.value = false
  }

  // Re-acquire when coming back to the foreground; the lock is not restored automatically.
  function onVisibility() {
    if (document.visibilityState === 'visible') void request()
  }
  document.addEventListener('visibilitychange', onVisibility)

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    void release()
  })

  return { active, supported, request, release }
}
