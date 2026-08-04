<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  values: number[]
  modelValue: number
  label: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

/** Row height in px. The selection band in DurationWheel must match it. */
const ITEM = 40
/** Odd, so exactly one row sits centred under the band. */
const VISIBLE = 5
const HEIGHT = ITEM * VISIBLE
const PAD = (HEIGHT - ITEM) / 2

const el = ref<HTMLElement | null>(null)

function indexOf(value: number): number {
  const i = props.values.indexOf(value)
  return i === -1 ? 0 : i
}

function scrollToIndex(i: number, smooth = false) {
  el.value?.scrollTo({ top: i * ITEM, behavior: smooth ? 'smooth' : 'auto' })
}

function onScroll() {
  const node = el.value
  if (!node) return
  const i = Math.max(0, Math.min(Math.round(node.scrollTop / ITEM), props.values.length - 1))
  const value = props.values[i]
  if (value !== props.modelValue) emit('update:modelValue', value)
}

function step(delta: number) {
  const i = Math.max(0, Math.min(indexOf(props.modelValue) + delta, props.values.length - 1))
  scrollToIndex(i, true)
  emit('update:modelValue', props.values[i])
}

// Follow external changes, but never fight a scroll that is already in the right place.
watch(
  () => props.modelValue,
  (value) => {
    const node = el.value
    if (!node) return
    const i = indexOf(value)
    if (Math.round(node.scrollTop / ITEM) !== i) scrollToIndex(i, true)
  },
)

// A frame late, so scroll-snap doesn't clobber the position before layout settles.
onMounted(() => requestAnimationFrame(() => scrollToIndex(indexOf(props.modelValue))))

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}
</script>

<template>
  <div
    ref="el"
    class="wheel w-16 snap-y snap-mandatory overflow-y-scroll outline-none"
    :style="{ height: `${HEIGHT}px` }"
    tabindex="0"
    role="listbox"
    :aria-label="label"
    @scroll.passive="onScroll"
    @keydown.up.prevent="step(-1)"
    @keydown.down.prevent="step(1)"
  >
    <div :style="{ height: `${PAD}px` }" />
    <div
      v-for="(value, i) in values"
      :key="value"
      class="flex cursor-pointer snap-center items-center justify-center font-mono text-xl tabular-nums transition-opacity"
      :class="value === modelValue ? 'opacity-100' : 'opacity-35'"
      :style="{ height: `${ITEM}px` }"
      role="option"
      :aria-selected="value === modelValue"
      @click="step(i - indexOf(modelValue))"
    >
      {{ pad2(value) }}
    </div>
    <div :style="{ height: `${PAD}px` }" />
  </div>
</template>

<style scoped>
/* Hide the scrollbar — the selection band is the affordance. */
.wheel {
  scrollbar-width: none;
  /* Fade the rows nearest the edges so the column reads as a drum. */
  mask-image: linear-gradient(to bottom, transparent, #000 26%, #000 74%, transparent);
}

.wheel::-webkit-scrollbar {
  display: none;
}
</style>
