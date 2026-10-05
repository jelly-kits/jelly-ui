import { onBeforeUnmount, nextTick, watch, type Ref } from 'vue'

/** 可聚焦元素选择器，用于算 Tab 循环 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * 模态浮层的焦点管理：
 * 打开时把焦点移进面板，Tab / Shift+Tab 在面板内部循环，关闭时把焦点还给原处。
 */
export function useFocusTrap(container: Ref<HTMLElement | null>, active: Ref<boolean>) {
  let previous: HTMLElement | null = null

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return
    const el = container.value
    if (!el) return

    const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (item) => item.offsetParent !== null,
    )
    if (items.length === 0) {
      // 面板里没有可聚焦元素时，把焦点锁在面板自己身上
      event.preventDefault()
      el.focus()
      return
    }

    const first = items[0]!
    const last = items[items.length - 1]!
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const detach = () => document.removeEventListener('keydown', onKeydown, true)

  watch(active, async (open) => {
    if (open) {
      previous = document.activeElement as HTMLElement | null
      await nextTick()
      const el = container.value
      if (!el) return
      const first = el.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? el).focus()
      document.addEventListener('keydown', onKeydown, true)
    } else {
      detach()
      // 关闭后焦点回到触发处，键盘用户不会掉到页面顶部
      previous?.focus?.()
      previous = null
    }
  })

  onBeforeUnmount(detach)
}
