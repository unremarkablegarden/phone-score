import { uid, type Draft, type Segment } from '../types'

/**
 * Share format for a score.
 *
 * The output is a single token — `PS1.` followed by base64url of the
 * deflated payload — because the thing people actually do with this is paste it
 * into a chat. One unbroken line with no quotes, braces or newlines survives
 * that trip; pretty-printed JSON does not (it gets wrapped, smart-quoted, or
 * swallowed by markdown).
 *
 * The payload itself is minimal: `{n: name, s: [[seconds, text], ...]}`.
 *
 * Reading is deliberately lenient — the token, that same JSON, or the older
 * verbose `{segments: [{seconds, text}]}` shape all import, so a hand-written
 * score works too.
 */
const PREFIX = 'PS1.'

type Payload = { n?: string; s: [number, string][] }

function toPayload(draft: Draft): Payload {
  return {
    n: draft.name.trim() || undefined,
    s: draft.segments.map((segment) => [segment.seconds, segment.text]),
  }
}

export async function encodeScore(draft: Draft): Promise<string> {
  const json = JSON.stringify(toPayload(draft))
  const bytes = await deflate(json)
  // Without CompressionStream the minified JSON is still a single line.
  return bytes ? PREFIX + toBase64Url(bytes) : json
}

export async function decodeScore(input: string): Promise<Draft | null> {
  const text = input.trim()
  if (!text) return null

  if (text.startsWith(PREFIX)) {
    const bytes = fromBase64Url(text.slice(PREFIX.length))
    if (!bytes) return null
    const json = await inflate(bytes)
    return json ? fromJson(json) : null
  }

  return fromJson(text)
}

function fromJson(text: string): Draft | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }

  const root: unknown = Array.isArray(data) ? { s: data } : data
  if (!root || typeof root !== 'object') return null
  const obj = root as Record<string, unknown>

  const segments: Segment[] = []

  // Compact form: s: [[seconds, text], ...]
  if (Array.isArray(obj.s)) {
    for (const entry of obj.s) {
      if (!Array.isArray(entry)) return null
      const [seconds, body] = entry as [unknown, unknown]
      const segment = toSegment(seconds, body)
      if (!segment) return null
      segments.push(segment)
    }
  } else if (Array.isArray(obj.segments)) {
    // Verbose form: segments: [{seconds, text}, ...]
    for (const entry of obj.segments) {
      if (!entry || typeof entry !== 'object') return null
      const { seconds, text: body } = entry as { seconds?: unknown; text?: unknown }
      const segment = toSegment(seconds, body)
      if (!segment) return null
      segments.push(segment)
    }
  } else {
    return null
  }

  if (segments.length === 0) return null

  const name = typeof obj.n === 'string' ? obj.n : typeof obj.name === 'string' ? obj.name : ''
  // Imported scores start unsaved, so they can't overwrite an existing one.
  return { id: null, name, segments }
}

function toSegment(seconds: unknown, body: unknown): Segment | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return null
  if (typeof body !== 'string') return null
  return { id: uid(), seconds: Math.round(seconds), text: body }
}

// --- compression ---

async function deflate(text: string): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

async function inflate(bytes: Uint8Array): Promise<string | null> {
  if (typeof DecompressionStream === 'undefined') return null
  try {
    const stream = new Blob([bytes as BlobPart])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw'))
    return await new Response(stream).text()
  } catch {
    return null
  }
}

// --- base64url ---

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array | null {
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}
