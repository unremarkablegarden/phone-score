<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { message, tone } = useToast()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="message"
      class="pointer-events-none fixed inset-x-0 bottom-28 z-60 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <span
        class="max-w-full truncate rounded-full px-4 py-2 text-sm font-medium shadow-lg"
        :class="tone === 'error' ? 'bg-red-600 text-white' : 'bg-app-fg text-app-bg'"
      >
        {{ message }}
      </span>
    </div>
  </Transition>
</template>
