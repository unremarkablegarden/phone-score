import { nextTick, onUnmounted, ref, watch, type Ref } from 'vue'

type Options = {
  container: Ref<HTMLElement | null>
  text: Ref<HTMLElement | null>
  /** Re-fit whenever this changes (the segment text / index). */
  source: () => unknown
  min?: number
  max?: number
}

/**
 * Sizes the text as large as it can go while still fitting its container.
 *
 * Binary-searches the font size and measures the real laid-out box, which is
 * the only reliable way to handle arbitrary multi-line text across phone
 * sizes, rotation and the iOS URL-bar resize.
 */
export function useFitText({ container, text, source, min = 14, max = 320 }: Options) {
  const fontSize = ref(min)

  function fit() {
    const box = container.value
    const el = text.value
    if (!box || !el || box.clientHeight === 0) return

    // clientHeight/Width include padding, so measure against the content box.
    const style = getComputedStyle(box)
    const availableHeight =
      box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    const availableWidth =
      box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    if (availableHeight <= 0 || availableWidth <= 0) return

    const fits = (size: number) => {
      el.style.fontSize = `${size}px`
      // Reading scrollHeight forces the reflow we need before comparing.
      return el.scrollHeight <= availableHeight && el.scrollWidth <= availableWidth
    }

    let lo = min
    let hi = max
    if (fits(hi)) {
      lo = hi
    } else {
      // ~10 halvings lands within a fraction of a pixel of the largest fitting size.
      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2
        if (fits(mid)) lo = mid
        else hi = mid
      }
    }
    fontSize.value = lo
    el.style.fontSize = `${lo}px`
  }

  watch(source, () => void nextTick(fit), { immediate: true })

  const observer = new ResizeObserver(() => fit())
  watch(
    container,
    (el, prev) => {
      if (prev) observer.unobserve(prev)
      if (el) observer.observe(el)
      void nextTick(fit)
    },
    { immediate: true },
  )

  onUnmounted(() => observer.disconnect())

  return { fontSize, fit }
}
