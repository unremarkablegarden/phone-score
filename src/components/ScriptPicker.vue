<script setup lang="ts">
import { useScripts } from '../composables/useScripts'
import { formatHuman } from '../lib/time'

const emit = defineEmits<{ close: []; open: [id: string] }>()

const { sorted, rename, remove } = useScripts()

function total(segments: { seconds: number }[]) {
  return formatHuman(segments.reduce((sum, s) => sum + s.seconds, 0))
}

function onRename(id: string, currentName: string) {
  const next = window.prompt('Rename script', currentName)
  if (next !== null) rename(id, next)
}

function onDelete(id: string, name: string) {
  if (window.confirm(`Delete “${name}”? This can't be undone.`)) remove(id)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
    @click.self="emit('close')"
  >
    <div
      class="flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-3xl border border-app-line bg-app-bg pad-safe-b sm:rounded-3xl"
    >
      <header class="flex items-center justify-between border-b border-app-line px-5 py-4">
        <h2 class="text-lg font-semibold">Saved scripts</h2>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-sm text-app-muted"
          @click="emit('close')"
        >
          Close
        </button>
      </header>

      <p v-if="!sorted.length" class="px-5 py-10 text-center text-sm text-app-muted">
        Nothing saved yet.
      </p>

      <ul v-else class="min-h-0 flex-1 divide-y divide-app-line overflow-y-auto">
        <li v-for="script in sorted" :key="script.id" class="flex items-center gap-2 px-3 py-3">
          <button
            type="button"
            class="min-w-0 flex-1 rounded-lg px-2 py-1 text-left"
            @click="emit('open', script.id)"
          >
            <span class="block truncate font-medium">{{ script.name }}</span>
            <span class="block text-xs text-app-muted">
              {{ script.segments.length }}
              {{ script.segments.length === 1 ? 'segment' : 'segments' }} ·
              {{ total(script.segments) }}
            </span>
          </button>
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-xs text-app-muted"
            @click="onRename(script.id, script.name)"
          >
            Rename
          </button>
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-xs text-app-muted hover:text-red-500"
            @click="onDelete(script.id, script.name)"
          >
            Delete
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
