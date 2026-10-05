import { ref } from 'vue'

/**
 * 底部弹出层的下拉关闭手势。
 *
 * 用法：把它返回的处理器挂到「拖拽把手」元素上，位移超过阈值即触发关闭。
 * 位移只做视觉反馈，松手后由组件自己决定回弹还是关闭。
 */
export function useSheetDrag(onDismiss: () => void, threshold = 96) {
  const offset = ref(0)
  const dragging = ref(false)
  let startY = 0
  let pointerId = -1

  const reset = () => {
    dragging.value = false
    offset.value = 0
    pointerId = -1
  }

  const onPointerDown = (event: PointerEvent) => {
    dragging.value = true
    startY = event.clientY
    pointerId = event.pointerId
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging.value || event.pointerId !== pointerId) return
    offset.value = Math.max(0, event.clientY - startY)
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging.value || event.pointerId !== pointerId) return
    const el = event.currentTarget as HTMLElement
    if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId)
    dragging.value = false

    if (offset.value > threshold) {
      onDismiss()
      return
    }
    offset.value = 0
  }

  return { offset, dragging, reset, onPointerDown, onPointerMove, onPointerUp }
}