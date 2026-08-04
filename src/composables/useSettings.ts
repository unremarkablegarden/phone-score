import { computed, reactive, ref, watch } from 'vue'
import { KEYS, read, write } from '../lib/storage'
import type { ColorPair, Settings, Theme } from '../types'

export const DEFAULTS: Record<'light' | 'dark', ColorPair> = {
  light: { fg: '#1c1917', bg: '#fafaf9' },
  dark: { fg: '#f5f5f4', bg: '#0e0d0c' },
}

function isSettings(v: unknown): v is Settings {
  return !!v && typeof v === 'object' && 'theme' in (v as object)
}

const settings = reactive<Settings>(
  read<Settings>(KEYS.settings, { theme: 'system', light: null, dark: null }, isSettings),
)

// Reactive mirror of the OS preference so the app follows a live theme switch.
const query = window.matchMedia('(prefers-color-scheme: dark)')
const systemDark = ref(query.matches)
query.addEventListener('change', (e) => {
  systemDark.value = e.matches
})

/** Which of the two palettes is currently active. */
const activeMode = computed<'light' | 'dark'>(() =>
  settings.theme === 'system' ? (systemDark.value ? 'dark' : 'light') : settings.theme,
)

/** The colours actually in effect right now (override if set, else default). */
const activeColors = computed<ColorPair>(
  () => settings[activeMode.value] ?? DEFAULTS[activeMode.value],
)

export function applySettings(): void {
  const root = document.documentElement
  const mode = activeMode.value
  root.classList.toggle('dark', mode === 'dark')

  const override = settings[mode]
  if (override) {
    root.style.setProperty('--app-fg', override.fg)
    root.style.setProperty('--app-bg', override.bg)
  } else {
    // Drop the inline props so the stylesheet defaults take over again.
    root.style.removeProperty('--app-fg')
    root.style.removeProperty('--app-bg')
  }

  // Keep the phone's status bar / browser chrome in step with the background.
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = override?.bg ?? DEFAULTS[mode].bg
}

watch(
  () => [settings.theme, settings.light, settings.dark, systemDark.value] as const,
  () => {
    applySettings()
    write(KEYS.settings, settings)
  },
  { deep: true },
)

export function useSettings() {
  function setTheme(theme: Theme) {
    settings.theme = theme
  }

  function setColors(mode: 'light' | 'dark', pair: ColorPair) {
    settings[mode] = { ...pair }
  }

  function resetColors(mode: 'light' | 'dark') {
    settings[mode] = null
  }

  return { settings, activeMode, activeColors, setTheme, setColors, resetColors }
}
