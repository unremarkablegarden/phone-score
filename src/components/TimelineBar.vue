<script setup lang="ts">
import type { Segment } from '../types'

defineProps<{
  segments: Segment[]
  /** 0..1 fill for each segment, index-aligned with `segments`. */
  progress: number[]
  currentIndex: number
}>()

const emit = defineEmits<{ seek: [index: number] }>()
</script>

<template>
  <div class="flex h-2 w-full gap-[2px]">
    <button
      v-for="(segment, i) in segments"
      :key="segment.id"
      type="button"
      class="relative h-full min-w-[3px] overflow-hidden rounded-full bg-app-faint/40 transition-opacity"
      :style="{ flexGrow: Math.max(segment.seconds, 1) }"
      :class="i === currentIndex ? 'opacity-100' : 'opacity-70'"
      :aria-label="`Jump to segment ${i + 1}`"
      @click="emit('seek', i)"
    >
      <span
        class="absolute inset-y-0 left-0 block rounded-full bg-app-fg"
        :style="{ width: `${(progress[i] ?? 0) * 100}%` }"
      />
    </button>
  </div>
</template>
