<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { nextZIndex } from '../../core/useZIndex'
import { jeDropdownMenuKey, type JeDropdownMenuContext } from './types'

defineOptions({ name: 'JeDropdownMenu' })

const props = withDefaults(
  defineProps<{
    /** 展开时是否显示遮罩 */
    overlay?: boolean
    /** 点击遮罩是否收起 */
    closeOnClickOverlay?: boolean
    /** 点击菜单之外是否收起 */
    closeOnClickOutside?: boolean
    /** 点击选项后是否自动收起 */
    closeOnClickOption?: boolean
    /** 面板展开方向，up 时在条目栏上方弹出 */
    direction?: 'down' | 'up'
    /** 展开 / 收起过渡时长（毫秒） */
    duration?: number
    /** 选中 / 展开态文字颜色，缺省用主题色 */
    activeColor?: string
    /** 未选中态文字颜色，缺省用次级文字色 */
    inactiveColor?: string
  }>(),
  {
    overlay: true,
    closeOnClickOverlay: true,
    closeOnClickOutside: true,
    closeOnClickOption: true,
    direction: 'down',
    duration: 200,
    activeColor: '',
    inactiveColor: '',
  },
)

const emit = defineEmits<{
  /** 第 index 项展开 */
  open: [index: number]
  /** 收起，回传收起前展开的那一项下标 */
  close: [index: number]
}>()

const rootRef = ref<HTMLElement | null>(null)
/** 根元素层级：每次展开重新取一次，保证后开的浮层压住先开的 */
const zIndex = ref(nextZIndex())
const activeIndex = ref(-1)

/* 子项按挂载顺序注册，据此把下标与展开项对齐 */
const items = ref<symbol[]>([])
const register = (key: symbol) => {
  if (!items.value.includes(key)) items.value = [...items.value, key]
  return items.value.indexOf(key)
}
const unregister = (key: symbol) => {
  items.value = items.value.filter((item) => item !== key)
}
const indexOf = (key: symbol) => items.value.indexOf(key)

const direction = computed(() => props.direction)
const activeColor = computed(() => props.activeColor || 'var(--je-primary)')
const inactiveColor = computed(() => props.inactiveColor || 'var(--je-text-muted)')
const duration = computed(() => props.duration)
const closeOnClickOption = computed(() => props.closeOnClickOption)

const refreshZIndex = () => {
  zIndex.value = nextZIndex()
  return zIndex.value
}

const close = () => {
  activeIndex.value = -1
}

const toggle = (index: number) => {
  if (activeIndex.value === index) {
    close()
    return
  }
  refreshZIndex()
  activeIndex.value = index
}

watch(activeIndex, (value, previous) => {
  if (value === -1) emit('close', previous === -1 ? -1 : previous)
  else emit('open', value)
})

// 点到菜单之外收起（有遮罩时点击会先落到遮罩上，由遮罩自己处理）
useClickOutside(rootRef, () => {
  if (activeIndex.value === -1) return
  if (!props.closeOnClickOutside) return
  close()
})

const onOverlayClick = () => {
  if (!props.closeOnClickOverlay) return
  close()
}

const context: JeDropdownMenuContext = {
  activeIndex,
  toggle,
  close,
  direction,
  activeColor,
  inactiveColor,
  duration,
  closeOnClickOption,
  refreshZIndex,
  register,
  unregister,
  indexOf,
}
provide(jeDropdownMenuKey, context)
</script>

<template>
  <div
    ref="rootRef"
    class="je-dropdown-menu"
    :class="{ 'is-open': activeIndex !== -1 }"
    :style="{ zIndex, '--je-dropdown-duration': `${duration}ms` }"
  >
    <div class="je-dropdown-menu__bar">
      <slot />
    </div>

    <!-- 遮罩放在根 stacking context 里：z-index 为负，永远在条目栏与面板之下、页面内容之上 -->
    <div
      class="je-dropdown-menu__overlay"
      :class="{ 'is-open': overlay && activeIndex !== -1 }"
      aria-hidden="true"
      @click="onOverlayClick"
    />
  </div>
</template>

<style scoped>
.je-dropdown-menu {
  position: relative;
  display: flex;
  align-items: stretch;
  font-family: inherit;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.je-dropdown-menu__bar {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  min-width: 0;
}

.je-dropdown-menu__overlay {
  position: fixed;
  inset: 0;
  /* 负层级把它压在条目栏与面板之下，但仍高于页面内容 */
  z-index: -1;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity var(--je-dropdown-duration, 200ms) ease,
    visibility 0s linear var(--je-dropdown-duration, 200ms);
}

.je-dropdown-menu__overlay.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity var(--je-dropdown-duration, 200ms) ease;
}

@media (prefers-reduced-motion: reduce) {
  .je-dropdown-menu__overlay,
  .je-dropdown-menu__overlay.is-open {
    transition: none;
  }
}
</style>