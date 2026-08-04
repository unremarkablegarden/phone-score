/**
 * Post-processes the icons that @vite-pwa/assets-generator gets wrong for our
 * source art.
 *
 * `public/icon.svg` is a rounded tile with transparent corners — right for a
 * favicon, wrong for the two icons the OS masks itself:
 *
 *   - maskable: Android crops to a circle/squircle and needs the background to
 *     run edge to edge. The preset instead insets the whole tile onto white,
 *     which shows as a white ring. We re-render it full-bleed with the art
 *     scaled into the 80% safe zone.
 *   - apple-touch: iOS applies its own squircle, so transparent corners land as
 *     black. Flatten onto the background colour instead.
 */
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const PUBLIC = new URL('../public/', import.meta.url).pathname
const BG = '#0b0a09'
/** Keeps the art inside the maskable safe zone (centre 80%). */
const SAFE_SCALE = 0.88

const source = readFileSync(`${PUBLIC}icon.svg`)

// Maskable: full-bleed background, art scaled down and centred.
// Derive `inner` from `pad` so the two always sum back to exactly 512.
const pad = Math.round((512 * (1 - SAFE_SCALE)) / 2)
const inner = 512 - pad * 2
await sharp(source)
  .resize(inner, inner)
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG })
  .flatten({ background: BG })
  .png()
  .toFile(`${PUBLIC}maskable-icon-512x512.png`)

// Apple touch: full-bleed, iOS supplies the rounding.
await sharp(source)
  .resize(180, 180)
  .flatten({ background: BG })
  .png()
  .toFile(`${PUBLIC}apple-touch-icon-180x180.png`)

console.log('fixed maskable-icon-512x512.png and apple-touch-icon-180x180.png')
