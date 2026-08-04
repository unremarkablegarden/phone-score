# Score

A timed text score for a phone. Build a list of `(duration, text)` rows on the setup page, hit
**Play**, and the app shows each text as large as it will fit with a countdown to the next one.

Everything is client-side — scores and colours live in `localStorage`. No backend, no accounts.

## Run it

```sh
bun install
bun dev            # http://localhost:5173
bun run build      # typecheck + production build
bun test           # duration parsing tests
```

## Setup page

- **Duration** accepts whatever's fastest to type — `5` → 5s, `90` → 90s, `1:30` → 90s,
  `2:05:00` → 2h 5m. It rewrites itself to `hh:mm:ss` when you leave the field.
- **Text** is multi-line; your line breaks are preserved on the play screen.
- Rows can be reordered, duplicated and deleted. Edits are auto-saved as a draft, so a reload
  never loses work.
- **Save** overwrites the open score, **Save as…** makes a new one (and offers to overwrite on a
  name clash), **Open…** lists everything saved.

## Play page

| Control | Action |
| --- | --- |
| Tap the text / `Space` | Pause & resume |
| `←` `→` | Previous / next segment |
| Tap a timeline segment | Jump to it |
| ↺ | Restart from the top |
| ⏻ / `Esc` | Back to setup |

The countdown is derived from `performance.now()` rather than accumulated per tick, so it can't
drift when the tab is backgrounded or the phone sleeps. The screen is kept awake via the Wake Lock
API where the browser supports it. Each segment change flashes the screen briefly; the last segment
holds at `00:00` rather than looping or exiting.

Previous-segment behaves like a music player: more than 1.5s into a segment, the first press
restarts that segment instead of going back.

## Appearance

System / Light / Dark, plus optional custom foreground and background colours per mode. The custom
pair is an override — clear it with "Use default" and the built-in palette comes back. Every other
colour in the UI is derived from those two with `color-mix`, so a custom pair recolours the whole
app coherently. A contrast warning appears below 4.5:1.

## Install on a phone

Add to Home Screen. The manifest requests `fullscreen` (falling back to `standalone`), and the iOS
`apple-mobile-web-app-*` metas cover Safari, which ignores the manifest's display mode. Because
there's no browser chrome once installed, the exit control on the play page is the only way back to
setup — it's always reachable.

To regenerate the icons after editing `public/icon.svg`:

```sh
bun run generate-pwa-assets
```

## Deploy

Static SPA. `vercel.json` rewrites everything to `index.html` so `/play` and `/settings` survive a
hard refresh.

```sh
vercel --prod
```
