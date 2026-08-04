<script setup lang="ts">
import { computed, ref } from 'vue'
import WheelColumn from './WheelColumn.vue'
import { formatDuration } from '../lib/time'

const props = defineProps<{ seconds: number }>()
const emit = defineEmits<{ close: []; apply: [seconds: number] }>()

// Hours run to 99 to match the ceiling the text field accepts.
const HOURS = Array.from({ length: 100 }, (_, i) => i)
const SIXTY = Array.from({ length: 60 }, (_, i) => i)

const hours = ref(Math.floor(props.seconds / 3600))
const minutes = ref(Math.floor((props.seconds % 3600) / 60))
const secs = ref(props.seconds % 60)

const total = computed(() => hours.value * 3600 + minutes.value * 60 + secs.value)
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pad-safe"
    role="dialog"
    aria-label="Set duration"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-sm rounded-3xl border border-app-line bg-app-bg shadow-2xl"
    >
      <header class="flex items-center justify-between border-b border-app-line px-4 py-3">
        <button type="button" class="rounded-lg px-2 py-1 text-sm text-app-muted" @click="emit('close')">
          Cancel
        </button>
        <span class="font-mono text-sm tabular-nums text-app-muted">
          {{ formatDuration(total) }}
        </span>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-sm font-semibold"
          @click="emit('apply', total)"
        >
          Done
        </button>
      </header>

      <div class="px-4 py-4">
        <div class="relative">
          <!-- Selection band, behind the wheels. h-10 must match WheelColumn's ITEM. -->
          <div
            class="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-app-raised"
          />
          <div class="relative flex justify-center gap-2">
            <WheelColumn v-model="hours" :values="HOURS" label="hours" />
            <WheelColumn v-model="minutes" :values="SIXTY" label="minutes" />
            <WheelColumn v-model="secs" :values="SIXTY" label="seconds" />
          </div>
        </div>

        <div class="mt-1 flex justify-center gap-2 text-center text-xs text-app-muted">
          <span class="w-16">hours</span>
          <span class="w-16">min</span>
          <span class="w-16">sec</span>
        </div>
      </div>
    </div>
  </div>
</template>
