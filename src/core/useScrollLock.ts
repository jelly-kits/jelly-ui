import { onScopeDispose, watch, type Ref } from 'vue'

/**
 * 全局引用计数：多个浮层同时打开时，只有最后一个关闭才真正解锁。
 */
let lockCount = 0
let savedOverflow = ''
let savedPaddingRight = ''

function applyLock() {
  const body = document.body
  savedOverflow = body.style.overflow
  savedPaddingRight = body.style.paddingRight
  // 滚动条消失会让内容横向跳动，用等宽内边距补回来
  const gap = window.innerWidth - document.documentElement.clientWidth
  body.style.overflow = 'hidden'
  if (gap > 0) body.style.paddingRight = `${gap}px`
}

function releaseLock() {
  const body = document.body
  body.style.overflow = savedOverflow
  body.style.paddingRight = savedPaddingRight
}

/**
 * 锁定 / 解锁页面滚动。传入一个「是否锁定」的 ref，随其变化自动生效，
 * 作用域销毁时自动释放（浮层卸载不会把页面卡死）。
 */
export function useScrollLock(locked: Ref<boolean>) {
  let active = false

  const set = (next: boolean) => {
    if (next === active) return
    if (typeof document === 'undefined') return
    active = next
    if (next) {
      if (lockCount === 0) applyLock()
      lockCount += 1
    } else {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) releaseLock()
    }
  }

  watch(locked, set, { immediate: true })
  onScopeDispose(() => set(false))
}