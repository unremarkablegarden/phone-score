<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ScorePicker from '../components/ScorePicker.vue'
import SegmentRow from '../components/SegmentRow.vue'
import ToastHost from '../components/ToastHost.vue'
import { useScores } from '../composables/useScores'
import { useToast } from '../composables/useToast'
import { copyText } from '../lib/clipboard'
import { formatHuman } from '../lib/time'
import { encodeScore } from '../lib/transfer'
import type { Segment } from '../types'

const router = useRouter()
const {
  draft,
  current,
  isDirty,
  totalSeconds,
  newDraft,
  open,
  save,
  saveAs,
  findByName,
  addSegment,
  removeSegment,
  duplicateSegment,
  moveSegment,
} = useScores()

const { toast } = useToast()

const pickerOpen = ref(false)
const invalidRows = reactive(new Set<string>())

const hasInvalid = computed(() => invalidRows.size > 0)
const hasText = computed(() => draft.value.segments.some((s) => s.text.trim().length > 0))
/** Rows with something to say but no time on the clock never get shown. */
const skipped = computed(
  () => draft.value.segments.filter((s) => s.seconds === 0 && s.text.trim().length > 0).length,
)
const canPlay = computed(() => !hasInvalid.value && totalSeconds.value > 0)

function setInvalid(id: string, value: boolean) {
  value ? invalidRows.add(id) : invalidRows.delete(id)
}

function patch(index: number, changes: Partial<Segment>) {
  Object.assign(draft.value.segments[index], changes)
}

function confirmDiscard(): boolean {
  if (!isDirty.value) return true
  return window.confirm('You have unsaved changes. Discard them?')
}

function onNew() {
  if (!confirmDiscard()) return
  invalidRows.clear()
  newDraft()
}

function onOpenPicker() {
  if (!confirmDiscard()) return
  pickerOpen.value = true
}

function onOpen(id: string) {
  invalidRows.clear()
  open(id)
  pickerOpen.value = false
}

function onSave() {
  if (current.value) {
    save()
  } else {
    onSaveAs()
  }
}

function onSaveAs() {
  const name = window.prompt('Save score as', draft.value.name || 'Untitled')
  if (name === null) return
  const clash = findByName(name)
  if (clash && clash.id !== draft.value.id) {
    if (!window.confirm(`“${clash.name}” already exists. Overwrite it?`)) return
    draft.value.id = clash.id
    draft.value.name = name
    save()
    return
  }
  saveAs(name)
}

async function onShare() {
  const link = `${location.origin}/${await encodeScore(draft.value)}`
  const ok = await copyText(link)
  if (ok) toast('Link copied — opening it loads this score')
  else toast("Couldn't reach the clipboard", 'error')
}

function onPlay() {
  if (!canPlay.value) return
  router.push('/play')
}
</script>

<template>
  <div class="flex min-h-full flex-col bg-app-bg text-app-fg pad-safe-x">
    <header
      class="sticky top-0 z-20 border-b border-app-line bg-app-bg/90 backdrop-blur pad-safe-t"
    >
      <div class="flex items-center gap-2 px-4 py-3">
        <div class="relative min-w-0 flex-1">
          <input
            v-model="draft.name"
            type="text"
            placeholder="Untitled score"
            aria-label="Score name"
            class="w-full rounded-lg bg-transparent py-1 pr-4 text-lg font-semibold outline-none placeholder:text-app-faint"
          />
          <span
            v-if="isDirty"
            class="absolute top-1/2 right-0 size-2 -translate-y-1/2 rounded-full bg-app-muted"
            title="Unsaved changes"
          />
        </div>
        <RouterLink
          to="/settings"
          class="grid size-9 shrink-0 place-items-center rounded-lg text-app-muted"
          aria-label="Appearance settings"
        >
          <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
            />
          </svg>
        </RouterLink>
      </div>

      <div class="flex gap-1.5 overflow-x-auto px-4 pb-3 text-sm">
        <button
          type="button"
          class="rounded-lg bg-app-raised px-3 py-1.5 font-medium disabled:opacity-40"
          :disabled="!isDirty"
          @click="onSave"
        >
          Save
        </button>
        <button
          type="button"
          class="rounded-lg bg-app-raised px-3 py-1.5 whitespace-nowrap"
          @click="onSaveAs"
        >
          Save as…
        </button>
        <button type="button" class="rounded-lg bg-app-raised px-3 py-1.5" @click="onOpenPicker">
          Open…
        </button>
        <button type="button" class="rounded-lg bg-app-raised px-3 py-1.5" @click="onNew">
          New
        </button>
        <span class="w-px shrink-0 self-stretch bg-app-line" aria-hidden="true" />
        <button type="button" class="rounded-lg bg-app-raised px-3 py-1.5" @click="onShare">
          Share
        </button>
      </div>
    </header>

    <main class="flex-1 px-4 py-4">
      <ul class="flex flex-col gap-3">
        <SegmentRow
          v-for="(segment, i) in draft.segments"
          :key="segment.id"
          :segment="segment"
          :index="i"
          :count="draft.segments.length"
          @update="patch(i, $event)"
          @move="moveSegment(i, $event)"
          @duplicate="duplicateSegment(i)"
          @remove="
            () => {
              setInvalid(segment.id, false)
              removeSegment(i)
            }
          "
          @invalid="setInvalid(segment.id, $event)"
        />
      </ul>

      <button
        type="button"
        class="mt-3 w-full rounded-2xl border border-dashed border-app-line py-3 text-sm font-medium text-app-muted"
        @click="addSegment"
      >
        + Add row
      </button>
    </main>

    <footer
      class="sticky bottom-0 z-20 border-t border-app-line bg-app-bg/90 px-4 pt-3 backdrop-blur pad-safe-b"
    >
      <div class="flex items-center gap-3 pb-3">
        <div class="min-w-0 flex-1 text-sm text-app-muted">
          <span class="tabular-nums">{{ formatHuman(totalSeconds) }}</span>
          <span>
            · {{ draft.segments.length }} {{ draft.segments.length === 1 ? 'row' : 'rows' }}
          </span>
          <span v-if="hasInvalid" class="block text-xs text-red-500">Fix the highlighted time</span>
          <span v-else-if="skipped" class="block text-xs text-amber-600 dark:text-amber-400">
            {{ skipped }} {{ skipped === 1 ? 'row has' : 'rows have' }} no time — will be skipped
          </span>
          <span v-else-if="!hasText" class="block text-xs">Rows have no text yet</span>
        </div>
        <button
          type="button"
          class="rounded-xl bg-app-fg px-8 py-3 text-base font-semibold text-app-bg disabled:opacity-30"
          :disabled="!canPlay"
          @click="onPlay"
        >
          Play
        </button>
      </div>
    </footer>

    <ScorePicker v-if="pickerOpen" @close="pickerOpen = false" @open="onOpen" />
    <ToastHost />
  </div>
</template>
