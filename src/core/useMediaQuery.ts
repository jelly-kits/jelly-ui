import { onScopeDispose, ref, type Ref } from 'vue'

/**
 * 订阅一条媒体查询，返回随视口变化实时更新的布尔 ref。
 * SSR / 非浏览器环境下恒为 false，且不注册任何监听。
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return matches

  const mql = window.matchMedia(query)
  matches.value = mql.matches

  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }
  mql.addEventListener('change', onChange)
  onScopeDispose(() => mql.removeEventListener('change', onChange))

  return matches
}

/** 窄屏判定，默认断点 768px。组件据此在「常规形态 / 底部弹出层」之间切换 */
export function useIsMobile(breakpoint = 768): Ref<boolean> {
  return useMediaQuery(`(max-width: ${breakpoint}px)`)
}