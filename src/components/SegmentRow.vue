<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import DurationWheel from './DurationWheel.vue'
import { formatDuration, parseDuration } from '../lib/time'
import type { Segment } from '../types'

const props = defineProps<{
  segment: Segment
  index: number
  count: number
}>()

const emit = defineEmits<{
  update: [patch: Partial<Segment>]
  move: [delta: number]
  duplicate: []
  remove: []
  invalid: [value: boolean]
}>()

const raw = ref(formatDuration(props.segment.seconds))
const invalid = ref(false)
const textarea = ref<HTMLTextAreaElement | null>(null)

// Keep the field in step when the segment changes underneath us (reorder, load).
watch(
  () => props.segment.seconds,
  (seconds) => {
    if (!invalid.value && parseDuration(raw.value) !== seconds) raw.value = formatDuration(seconds)
  },
)

watch(
  () => props.segment.text,
  () => void nextTick(autoGrow),
)

function onDurationInput() {
  const parsed = parseDuration(raw.value)
  invalid.value = parsed === null
  emit('invalid', invalid.value)
  if (parsed !== null) emit('update', { seconds: parsed })
}

function onDurationBlur() {
  const parsed = parseDuration(raw.value)
  if (parsed !== null) raw.value = formatDuration(parsed)
}

const wheelOpen = ref(false)

function onWheelApply(seconds: number) {
  raw.value = formatDuration(seconds)
  invalid.value = false
  emit('invalid', false)
  emit('update', { seconds })
  wheelOpen.value = false
}

function autoGrow() {
  const el = textarea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function onTextInput(event: Event) {
  emit('update', { text: (event.target as HTMLTextAreaElement).value })
  autoGrow()
}

onMounted(autoGrow)
</script>

<template>
  <li class="rounded-2xl border border-app-line bg-app-surface p-3">
    <div class="flex items-center gap-2">
      <span
        class="grid size-7 shrink-0 place-items-center rounded-full bg-app-raised text-xs font-semibold tabular-nums text-app-muted"
      >
        {{ index + 1 }}
      </span>

      <input
        v-model="raw"
        type="text"
        inputmode="numeric"
        placeholder="hh:mm:ss"
        aria-label="Duration"
        class="w-28 rounded-lg border bg-app-bg px-2 py-1.5 text-center font-mono text-sm tabular-nums outline-none focus:ring-2 focus:ring-app-faint"
        :class="invalid ? 'border-red-500 text-red-500' : 'border-app-line'"
        @input="onDurationInput"
        @blur="onDurationBlur"
      />

      <button
        type="button"
        class="grid size-8 shrink-0 place-items-center rounded-lg text-app-muted"
        aria-label="Pick duration"
        @click="wheelOpen = true"
      >
        <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" stroke-linecap="round" />
        </svg>
      </button>

      <div class="ml-auto flex items-center gap-0.5">
        <button
          type="button"
          class="grid size-8 place-items-center rounded-lg text-app-muted disabled:opacity-25"
          :disabled="index === 0"
          aria-label="Move up"
          @click="emit('move', -1)"
        >
          ↑
        </button>
        <button
          type="button"
          class="grid size-8 place-items-center rounded-lg text-app-muted disabled:opacity-25"
          :disabled="index === count - 1"
          aria-label="Move down"
          @click="emit('move', 1)"
        >
          ↓
        </button>
        <button
          type="button"
          class="grid size-8 place-items-center rounded-lg text-sm text-app-muted"
          aria-label="Duplicate"
          @click="emit('duplicate')"
        >
          ⧉
        </button>
        <button
          type="button"
          class="grid size-8 place-items-center rounded-lg text-app-muted hover:text-red-500"
          aria-label="Delete"
          @click="emit('remove')"
        >
          ✕
        </button>
      </div>
    </div>

    <textarea
      ref="textarea"
      :value="segment.text"
      rows="2"
      placeholder="Text to show…"
      class="mt-2 block w-full resize-none rounded-lg border border-app-line bg-app-bg px-3 py-2 text-base leading-snug outline-none focus:ring-2 focus:ring-app-faint"
      @input="onTextInput"
    />

    <DurationWheel
      v-if="wheelOpen"
      :seconds="segment.seconds"
      @close="wheelOpen = false"
      @apply="onWheelApply"
    />
  </li>
</template>
