<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TimelineBar from '../components/TimelineBar.vue'
import { useFitText } from '../composables/useFitText'
import { usePlayer } from '../composables/usePlayer'
import { useScripts } from '../composables/useScripts'
import { useWakeLock } from '../composables/useWakeLock'
import { formatCountdown } from '../lib/time'

const router = useRouter()
const { draft } = useScripts()

const segments = computed(() => draft.value.segments.filter((s) => s.seconds > 0))

const {
  isPaused,
  currentIndex,
  currentSegment,
  segmentRemainingMs,
  totalRemainingMs,
  segmentProgress,
  start,
  toggle,
  next,
  prev,
  restart,
  seekTo,
  stop,
} = usePlayer(() => segments.value)

const wakeLock = useWakeLock()

const textBox = ref<HTMLElement | null>(null)
const textEl = ref<HTMLElement | null>(null)

useFitText({
  container: textBox,
  text: textEl,
  source: () => currentSegment.value?.text ?? '',
})

// --- segment-change flash ---
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const flashPeak = reducedMotion ? 0.12 : 0.8
const flashFade = reducedMotion ? 120 : 260
const flashing = ref(false)

watch(currentIndex, () => {
  flashing.value = true
  // Two frames: the peak has to actually paint before we start fading it out.
  requestAnimationFrame(() => requestAnimationFrame(() => (flashing.value = false)))
})

// --- auto-fading controls ---
const controlsVisible = ref(true)
let hideTimer: ReturnType<typeof setTimeout> | undefined

function bumpControls() {
  controlsVisible.value = true
  clearTimeout(hideTimer)
  if (!isPaused.value) hideTimer = setTimeout(() => (controlsVisible.value = false), 3000)
}

watch(isPaused, bumpControls)

function act(fn: () => void) {
  fn()
  bumpControls()
}

function exit() {
  router.push('/')
}

function onKey(event: KeyboardEvent) {
  switch (event.key) {
    case ' ':
      event.preventDefault()
      act(toggle)
      break
    case 'ArrowRight':
      act(next)
      break
    case 'ArrowLeft':
      act(prev)
      break
    case 'Escape':
      exit()
      break
  }
}

onMounted(() => {
  if (segments.value.length === 0) {
    router.replace('/')
    return
  }
  start()
  void wakeLock.request()
  bumpControls()
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
  window.removeEventListener('keydown', onKey)
  stop()
})
</script>

<template>
  <div
    class="relative flex h-[100svh] w-full flex-col overflow-hidden bg-app-bg text-app-fg select-none pad-safe"
    style="touch-action: manipulation"
  >
    <!-- timeline -->
    <div class="shrink-0 px-4 pt-3" @pointerdown="bumpControls">
      <TimelineBar
        :segments="segments"
        :progress="segmentProgress"
        :current-index="currentIndex"
        @seek="(i) => act(() => seekTo(i))"
      />
      <div class="mt-2 flex items-baseline justify-between font-mono text-xs text-app-muted">
        <span class="tabular-nums">{{ currentIndex + 1 }}/{{ segments.length }}</span>
        <span class="tabular-nums">−{{ formatCountdown(totalRemainingMs) }}</span>
      </div>
    </div>

    <!-- countdown to the next text -->
    <div class="shrink-0 py-2 text-center">
      <span
        class="font-mono text-4xl leading-none font-light tabular-nums transition-opacity sm:text-5xl"
        :class="isPaused ? 'opacity-40' : 'opacity-80'"
      >
        {{ formatCountdown(segmentRemainingMs) }}
      </span>
    </div>

    <!-- the text, sized to fill whatever space is left -->
    <div
      ref="textBox"
      class="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-2"
      @click="act(toggle)"
    >
      <div
        ref="textEl"
        class="w-full text-center leading-[1.1] font-semibold [overflow-wrap:anywhere] [white-space:pre-wrap]"
      >{{ currentSegment?.text || ' ' }}</div>
    </div>

    <!-- controls -->
    <div
      class="relative flex shrink-0 items-center justify-center gap-1 px-2 pt-2 pb-3 transition-opacity duration-500"
      :class="controlsVisible ? 'opacity-100' : 'opacity-15'"
      @pointerdown="bumpControls"
    >
      <div class="absolute left-2 flex items-center">
        <button
          type="button"
          class="grid size-11 place-items-center rounded-full text-app-muted"
          aria-label="Exit to setup"
          @click="exit"
        >
          <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
        <button
          type="button"
          class="grid size-11 place-items-center rounded-full text-app-muted"
          aria-label="Restart from the beginning"
          @click="act(restart)"
        >
          <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        class="grid size-14 place-items-center rounded-full"
        aria-label="Previous segment"
        @click="act(prev)"
      >
        <svg viewBox="0 0 24 24" class="size-7" fill="currentColor">
          <path d="M18 5v14l-11-7zM6 5h2v14H6z" />
        </svg>
      </button>

      <button
        type="button"
        class="grid size-16 place-items-center rounded-full bg-app-fg text-app-bg"
        :aria-label="isPaused ? 'Play' : 'Pause'"
        @click="act(toggle)"
      >
        <svg v-if="isPaused" viewBox="0 0 24 24" class="size-8" fill="currentColor">
          <path d="M7 4v16l13-8z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" class="size-8" fill="currentColor">
          <path d="M7 4h4v16H7zM13 4h4v16h-4z" />
        </svg>
      </button>

      <button
        type="button"
        class="grid size-14 place-items-center rounded-full"
        aria-label="Next segment"
        @click="act(next)"
      >
        <svg viewBox="0 0 24 24" class="size-7" fill="currentColor">
          <path d="M6 5v14l11-7zM16 5h2v14h-2z" />
        </svg>
      </button>
    </div>

    <!-- segment-change flash -->
    <div
      class="pointer-events-none absolute inset-0 bg-app-fg"
      :style="{
        opacity: flashing ? flashPeak : 0,
        transition: flashing ? 'none' : `opacity ${flashFade}ms ease-out`,
      }"
    />
  </div>
</template>
