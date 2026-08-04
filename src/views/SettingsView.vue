<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULTS, useSettings } from '../composables/useSettings'
import { contrastRatio } from '../lib/contrast'
import type { Theme } from '../types'

const { settings, activeMode, setTheme, setColors, resetColors } = useSettings()

const themes: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const modes = ['light', 'dark'] as const

function pair(mode: 'light' | 'dark') {
  return settings[mode] ?? DEFAULTS[mode]
}

function isCustom(mode: 'light' | 'dark') {
  return settings[mode] !== null
}

function update(mode: 'light' | 'dark', key: 'fg' | 'bg', value: string) {
  setColors(mode, { ...pair(mode), [key]: value })
}

const ratios = computed(() =>
  Object.fromEntries(modes.map((m) => [m, contrastRatio(pair(m).fg, pair(m).bg)])) as Record<
    'light' | 'dark',
    number
  >,
)
</script>

<template>
  <div class="flex min-h-full flex-col bg-app-bg text-app-fg pad-safe-x">
    <header class="sticky top-0 z-10 border-b border-app-line bg-app-bg/90 backdrop-blur pad-safe-t">
      <div class="flex items-center gap-2 px-4 py-3">
        <RouterLink to="/" class="rounded-lg px-2 py-1 text-sm text-app-muted">‹ Back</RouterLink>
        <h1 class="text-lg font-semibold">Appearance</h1>
      </div>
    </header>

    <main class="flex-1 px-4 py-5">
      <section>
        <h2 class="mb-2 text-sm font-medium text-app-muted">Mode</h2>
        <div class="flex gap-1 rounded-xl bg-app-surface p-1">
          <button
            v-for="theme in themes"
            :key="theme.value"
            type="button"
            class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
            :class="
              settings.theme === theme.value ? 'bg-app-fg text-app-bg' : 'text-app-muted'
            "
            @click="setTheme(theme.value)"
          >
            {{ theme.label }}
          </button>
        </div>
      </section>

      <section v-for="mode in modes" :key="mode" class="mt-6">
        <div class="mb-2 flex items-baseline justify-between">
          <h2 class="text-sm font-medium text-app-muted capitalize">
            {{ mode }} colours
            <span v-if="mode === activeMode" class="text-xs opacity-60">· active</span>
          </h2>
          <button
            v-if="isCustom(mode)"
            type="button"
            class="text-xs text-app-muted underline underline-offset-2"
            @click="resetColors(mode)"
          >
            Use default
          </button>
        </div>

        <div class="rounded-2xl border border-app-line bg-app-surface p-3">
          <div class="flex gap-3">
            <label class="flex flex-1 items-center gap-3">
              <input
                type="color"
                class="size-10 shrink-0 rounded-lg ring-1 ring-app-line"
                :value="pair(mode).bg"
                @input="update(mode, 'bg', ($event.target as HTMLInputElement).value)"
              />
              <span class="text-sm">
                Background
                <span class="block font-mono text-xs text-app-muted">{{ pair(mode).bg }}</span>
              </span>
            </label>
            <label class="flex flex-1 items-center gap-3">
              <input
                type="color"
                class="size-10 shrink-0 rounded-lg ring-1 ring-app-line"
                :value="pair(mode).fg"
                @input="update(mode, 'fg', ($event.target as HTMLInputElement).value)"
              />
              <span class="text-sm">
                Text
                <span class="block font-mono text-xs text-app-muted">{{ pair(mode).fg }}</span>
              </span>
            </label>
          </div>

          <div
            class="mt-3 grid h-20 place-items-center rounded-xl text-2xl font-semibold"
            :style="{ backgroundColor: pair(mode).bg, color: pair(mode).fg }"
          >
            The quick brown fox
          </div>

          <p
            v-if="ratios[mode] < 4.5"
            class="mt-2 text-xs text-amber-600 dark:text-amber-400"
          >
            Low contrast ({{ ratios[mode].toFixed(1) }}:1) — this may be hard to read at a distance.
          </p>
        </div>
      </section>

      <p class="mt-6 text-xs text-app-muted">
        Colours and saved scripts live in this browser's local storage.
      </p>
    </main>
  </div>
</template>
