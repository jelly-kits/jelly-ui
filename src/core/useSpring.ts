import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue'
import { springTo, type SpringConfig } from './spring'

export interface UseSpringReturn {
  /** 当前值，直接用于模板 / computed 即可获得逐帧更新 */
  value: Ref<number>
  /** 弹性过渡到目标值，第三个参数可覆盖本次动画参数 */
  set: (target: number, config?: Partial<SpringConfig>) => void
  /** 不做动画，立刻跳到目标值 */
  jump: (target: number) => void
  /** 中断当前动画 */
  stop: () => void
}

interface MediaQueryList {
  matches: boolean
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return (window.matchMedia('(prefers-reduced-motion: reduce)') as MediaQueryList).matches
}

/**
 * 单值弹簧：返回一个会被弹簧逐帧驱动的 ref。
 *
 * 组件卸载（作用域销毁）时自动中断动画，不会泄漏 rAF；
 * 开启「减弱动效」时直接落到终点。
 */
export function useSpring(initial: number, config: SpringConfig): UseSpringReturn {
  const value = ref(initial)
  let cancel: (() => void) | null = null

  const stop = () => {
    cancel?.()
    cancel = null
  }

  const jump = (target: number) => {
    stop()
    value.value = target
  }

  const set = (target: number, override?: Partial<SpringConfig>) => {
    stop()

    if (target === value.value || prefersReducedMotion()) {
      value.value = target
      return
    }

    cancel = springTo(value.value, target, { ...config, ...override }, (v, done) => {
      value.value = v
      if (done) cancel = null
    })
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return { value, set, jump, stop }
}