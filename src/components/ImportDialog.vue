<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { decodeScore } from '../lib/transfer'
import type { Draft } from '../types'

const emit = defineEmits<{ close: []; imported: [draft: Draft] }>()

const text = ref('')
const error = ref('')
const area = ref<HTMLTextAreaElement | null>(null)

async function onConfirm() {
  const draft = await decodeScore(text.value)
  if (!draft) {
    error.value = "That doesn't look like a score."
    return
  }
  emit('imported', draft)
}

onMounted(() => void nextTick(() => area.value?.focus()))
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pad-safe"
    role="dialog"
    aria-label="Import a score"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md rounded-3xl border border-app-line bg-app-bg p-5 shadow-2xl">
      <h2 class="text-lg font-semibold">Import a score</h2>
      <p class="mt-1 text-sm text-app-muted">Paste an exported score below.</p>

      <textarea
        ref="area"
        v-model="text"
        rows="5"
        placeholder="PS1.…"
        class="mt-3 block w-full resize-none rounded-xl border border-app-line bg-app-surface px-3 py-2 font-mono text-xs break-all outline-none focus:ring-2 focus:ring-app-faint"
        @input="error = ''"
      />

      <p v-if="error" class="mt-2 text-xs text-red-500">{{ error }}</p>

      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm text-app-muted"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-app-fg px-4 py-2 text-sm font-semibold text-app-bg disabled:opacity-30"
          :disabled="!text.trim()"
          @click="onConfirm"
        >
          Import
        </button>
      </div>
    </div>
  </div>
</template>
