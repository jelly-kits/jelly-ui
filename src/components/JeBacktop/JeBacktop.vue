<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { JeIcon } from '../JeIcon'
import type { JeBacktopProps } from './types'

defineOptions({ name: 'JeBacktop' })

const props = withDefaults(defineProps<JeBacktopProps>(), {
  target: '',
  visibilityHeight: 200,
  right: 40,
  bottom: 40,
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const visible = ref(false)

/** 滚动容器：选择器命中元素时用它，否则退回窗口 */
let container: HTMLElement | Window | null = null
let resizeObserver: ResizeObserver | null = null

const style = computed(() => ({
  '--je-backtop-right': `${props.right}px`,
  '--je-backtop-bottom': `${props.bottom}px`,
}))

const resolveContainer = (): HTMLElement | Window => {
  if (props.target) {
    const el = document.querySelector<HTMLElement>(props.target)
    if (el) return el
  }
  return window
}

const getScrollTop = (): number => {
  if (container instanceof Window) return container.scrollY
  return container?.scrollTop ?? 0
}

const update = () => {
  visible.value = getScrollTop() > props.visibilityHeight
}

const unbind = () => {
  // 联合类型上直接调用 addEventListener 会被 TS 拒掉，收窄成 EventTarget
  ;(container as EventTarget | null)?.removeEventListener('scroll', update)
  resizeObserver?.disconnect()
  resizeObserver = null
  container = null
}

const bind = () => {
  unbind()
  container = resolveContainer()
  ;(container as EventTarget).addEventListener('scroll', update, { passive: true })
  if (container instanceof HTMLElement && typeof ResizeObserver !== 'undefined') {
    // 容器高度变化会让可滚动距离变化，需要重新判定是否显示
    resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(container)
  }
  update()
}

const onClick = (event: MouseEvent) => {
  emit('click', event)
  const reduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth'
  if (container instanceof Window) container.scrollTo({ top: 0, behavior })
  else container?.scrollTo({ top: 0, behavior })
}

watch(() => props.target, bind)
onMounted(bind)
onBeforeUnmount(unbind)
</script>

<template>
  <button
    class="je-backtop"
    :class="{ 'is-visible': visible }"
    :style="style"
    type="button"
    aria-label="回到顶部"
    @click="onClick"
  >
    <JeIcon name="chevron-up" :size="20" />
  </button>
</template>

<style scoped>
.je-backtop {
  position: fixed;
  right: var(--je-backtop-right, 40px);
  bottom: var(--je-backtop-bottom, 40px);
  z-index: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 48px;
  height: 48px;
  padding: 0;
  /* 回顶按钮本身就是品牌渐变，图标固定浅色 */
  color: var(--je-text-on-color);
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border: none;
  border-radius: 50%;
  box-shadow: 0 10px 30px color-mix(in srgb, var(--je-primary) 45%, transparent);
  cursor: pointer;
  outline: none;
  /* 收起态用 visibility 而不是 display，出场动画才有过渡 */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(12px) scale(0.9);
  transition: transform 0.28s var(--je-ease-out-back), opacity 0.24s ease,
    visibility 0s linear 0.28s, box-shadow var(--je-duration) ease;
}

.je-backtop.is-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0) scale(1);
  transition: transform 0.32s var(--je-ease-out-back), opacity 0.24s ease,
    box-shadow var(--je-duration) ease;
}

.je-backtop:hover {
  box-shadow: 0 14px 36px color-mix(in srgb, var(--je-primary) 60%, transparent);
}

.je-backtop:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 3px;
}

/* 窄屏：贴边收窄并避开安全区，热区保持 48px */
@media (max-width: 768px) {
  .je-backtop {
    right: 16px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-backtop,
  .je-backtop.is-visible {
    transition: none;
  }
}
</style>
