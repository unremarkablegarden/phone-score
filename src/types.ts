export type Segment = {
  id: string
  seconds: number
  text: string
}

export type Score = {
  id: string
  name: string
  segments: Segment[]
  updatedAt: number
}

/** The setup page's working state — persisted so a reload never loses edits. */
export type Draft = {
  /** id of the saved score this draft came from, or null for an unsaved one */
  id: string | null
  name: string
  segments: Segment[]
}

export type ColorPair = { fg: string; bg: string }

export type Theme = 'system' | 'light' | 'dark'

export type Settings = {
  theme: Theme
  /** null means "use the built-in default for this mode" */
  light: ColorPair | null
  dark: ColorPair | null
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
