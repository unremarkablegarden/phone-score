import { computed, onUnmounted, ref, shallowRef } from 'vue'
import type { Segment } from '../types'

/**
 * The playback clock.
 *
 * Elapsed time is always *derived* from performance.now() against a start
 * stamp — never accumulated tick-by-tick — so a throttled rAF, a backgrounded
 * tab or a sleeping phone can't make it drift.
 */
export function usePlayer(segments: () => Segment[]) {
  const list = computed(() => segments())

  /** Start offset (ms) of each segment, plus a final entry equal to the total. */
  const offsets = computed(() => {
    const out: number[] = [0]
    let acc = 0
    for (const s of list.value) {
      acc += Math.max(0, s.seconds) * 1000
      out.push(acc)
    }
    return out
  })

  const totalMs = computed(() => offsets.value.at(-1) ?? 0)

  const elapsedMs = ref(0)
  const isPaused = ref(false)
  const isFinished = ref(false)

  // Clock baseline: elapsed = baseElapsed + (now - startedAt) while running.
  let baseElapsed = 0
  let startedAt = 0
  const frame = shallowRef<number | null>(null)

  function now() {
    return performance.now()
  }

  /** Hold on the final segment with the countdown at zero. */
  function finish() {
    stop()
    baseElapsed = totalMs.value
    elapsedMs.value = totalMs.value
    isPaused.value = true
    isFinished.value = true
  }

  function tick() {
    if (isPaused.value) return
    const value = baseElapsed + (now() - startedAt)
    if (value >= totalMs.value) {
      finish()
      return
    }
    elapsedMs.value = value
    frame.value = requestAnimationFrame(tick)
  }

  function run() {
    if (frame.value !== null) cancelAnimationFrame(frame.value)
    startedAt = now()
    frame.value = requestAnimationFrame(tick)
  }

  function stop() {
    if (frame.value !== null) cancelAnimationFrame(frame.value)
    frame.value = null
  }

  function start() {
    baseElapsed = 0
    elapsedMs.value = 0
    isPaused.value = false
    isFinished.value = false
    run()
  }

  function pause() {
    if (isPaused.value) return
    baseElapsed = baseElapsed + (now() - startedAt)
    elapsedMs.value = Math.min(baseElapsed, totalMs.value)
    isPaused.value = true
    stop()
  }

  function resume() {
    if (!isPaused.value) return
    if (isFinished.value) {
      // Resuming from the end restarts rather than sitting at zero forever.
      restart()
      return
    }
    isPaused.value = false
    run()
  }

  function toggle() {
    isPaused.value ? resume() : pause()
  }

  /** Move the clock to an absolute elapsed position, keeping play/pause state. */
  function seek(ms: number) {
    const clamped = Math.max(0, Math.min(ms, Math.max(0, totalMs.value - 1)))
    baseElapsed = clamped
    elapsedMs.value = clamped
    isFinished.value = false
    if (!isPaused.value) run()
  }

  function seekTo(index: number) {
    const start = offsets.value[Math.max(0, Math.min(index, list.value.length - 1))] ?? 0
    seek(start)
  }

  function restart() {
    isFinished.value = false
    isPaused.value = false
    baseElapsed = 0
    elapsedMs.value = 0
    run()
  }

  const currentIndex = computed(() => {
    const t = elapsedMs.value
    const marks = offsets.value
    for (let i = list.value.length - 1; i >= 0; i--) {
      if (t >= marks[i]) return i
    }
    return 0
  })

  const currentSegment = computed(() => list.value[currentIndex.value] ?? null)

  const segmentElapsedMs = computed(() => elapsedMs.value - (offsets.value[currentIndex.value] ?? 0))

  const segmentDurationMs = computed(() => Math.max(0, (currentSegment.value?.seconds ?? 0) * 1000))

  const segmentRemainingMs = computed(() =>
    Math.max(0, segmentDurationMs.value - segmentElapsedMs.value),
  )

  const totalRemainingMs = computed(() => Math.max(0, totalMs.value - elapsedMs.value))

  const totalProgress = computed(() =>
    totalMs.value === 0 ? 0 : elapsedMs.value / totalMs.value,
  )

  /** 0..1 fill for every segment — 1 for past, 0 for future, live for current. */
  const segmentProgress = computed(() =>
    list.value.map((s, i) => {
      const duration = Math.max(0, s.seconds) * 1000
      if (i < currentIndex.value) return 1
      if (i > currentIndex.value) return 0
      if (duration === 0) return 1
      return Math.min(1, Math.max(0, segmentElapsedMs.value / duration))
    }),
  )

  function next() {
    if (currentIndex.value >= list.value.length - 1) {
      finish() // already on the last one — jump straight to the hold state
      return
    }
    seekTo(currentIndex.value + 1)
  }

  function prev() {
    // Like a music player: first press restarts the current segment.
    if (segmentElapsedMs.value > 1500 || currentIndex.value === 0) {
      seekTo(currentIndex.value)
    } else {
      seekTo(currentIndex.value - 1)
    }
  }

  onUnmounted(stop)

  return {
    elapsedMs,
    isPaused,
    isFinished,
    totalMs,
    currentIndex,
    currentSegment,
    segmentRemainingMs,
    segmentDurationMs,
    totalRemainingMs,
    totalProgress,
    segmentProgress,
    start,
    pause,
    resume,
    toggle,
    next,
    prev,
    restart,
    seekTo,
    stop,
  }
}
