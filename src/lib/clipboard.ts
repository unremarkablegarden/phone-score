/**
 * Clipboard access is refused often enough — insecure origins, Firefox's blanket
 * block on reads, Safari wanting a fresh user gesture — that both directions
 * have to be able to fail without throwing.
 */

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '0'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

/** Null when the read was refused or the clipboard holds nothing useful. */
export async function readText(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText()
    return text.trim() ? text : null
  } catch {
    return null
  }
}
