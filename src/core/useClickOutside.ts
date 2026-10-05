import { onBeforeUnmount, onMounted, type Ref } from 'vue'

export type JeOutsideTarget = Ref<HTMLElement | null> | Ref<HTMLElement | null>[]

/**
 * 点击（含触摸）浮层之外的地方时触发回调。
 *
 * 传数组可以把「触发元素」和「浮层」一起视作内部，
 * 这样点触发器本身不会先被判成 outside、再被 toggle 打开（闪烁一下）。
 * 监听挂在捕获阶段，早于元素自身的点击逻辑。
 */
export function useClickOutside(
  targets: JeOutsideTarget,
  handler: (event: PointerEvent) => void,
) {
  const list = Array.isArray(targets) ? targets : [targets]

  const onPointerDown = (event: PointerEvent) => {
    const node = event.target as Node | null
    if (!node) return
    for (const target of list) {
      const el = target.value
      if (el && el.contains(node)) return
    }
    handler(event)
  }

  onMounted(() => document.addEventListener('pointerdown', onPointerDown, true))
  onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown, true))
}
