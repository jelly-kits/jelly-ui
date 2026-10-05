<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, useId, watch } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import { JeIcon } from '../JeIcon'
import { jeDropdownKey, type JeDropdownContext } from './types'
import type { JePlacementValue } from '../../core/useFloating'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeDropdown' })

const props = withDefaults(
  defineProps<{
    /** 桌面端触发方式；窄屏一律点击切换 */
    trigger?: 'hover' | 'click'
    placement?: JePlacementValue
    disabled?: boolean
    /** 选中某一项后是否自动收起 */
    closeOnClick?: boolean
    /** 触发区拆成「主按钮 + 箭头」两段，主按钮内容同样来自 trigger 插槽 */
    splitButton?: boolean
    /** 菜单最大高度（px），超出可滚动 */
    maxHeight?: number
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    trigger: 'click',
    placement: 'bottom-start',
    disabled: false,
    closeOnClick: true,
    splitButton: false,
    maxHeight: 280,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  command: [value: string | number]
  'visible-change': [visible: boolean]
}>()

const uid = useId()
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const zIndex = ref(nextZIndex())

const isMobile = useIsMobile()
const locked = computed(() => isMobile.value && isOpen.value)
useScrollLock(locked)

const sheet = useSheetDrag(() => close())

const { x, y } = useFloating({
  reference: rootRef,
  floating: panelRef,
  open: isOpen,
  placement: () => props.placement,
  offset: 6,
})

const panelStyle = computed(() => {
  const style: Record<string, string | number> = { zIndex: zIndex.value }
  if (isMobile.value) {
    // 窄屏是贴底弹层，方位交给 CSS，只用内联 transform 跟手拖拽
    if (isOpen.value) {
      style.transform = `translateY(${sheet.offset.value}px)`
      if (sheet.dragging.value) style.transition = 'none'
    }
    return style
  }
  style.left = `${x.value}px`
  style.top = `${y.value}px`
  return style
})

const listStyle = computed(() =>
  isMobile.value ? undefined : { maxHeight: `${props.maxHeight}px` },
)

const focusTrigger = () => {
  rootRef.value
    ?.querySelector<HTMLElement>('[data-je-dropdown-trigger]')
    ?.focus()
}

const getItems = () => {
  const menu = menuRef.value
  if (!menu) return [] as HTMLElement[]
  return Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter(
    (el) => el.getAttribute('aria-disabled') !== 'true',
  )
}

/** 键盘高亮（roving focus）：方向键在可用项之间移动 */
const moveFocus = (step: number) => {
  const items = getItems()
  if (items.length === 0) return
  const current = items.findIndex((el) => el === document.activeElement)
  const next =
    current < 0 ? (step > 0 ? 0 : items.length - 1) : (current + step + items.length) % items.length
  items[next]?.focus()
}

const close = () => {
  if (!isOpen.value) return
  isOpen.value = false
  emit('visible-change', false)
}

const closeAndRestore = () => {
  if (!isOpen.value) return
  close()
  focusTrigger()
}

const open = () => {
  if (props.disabled || isOpen.value) return
  sheet.reset()
  zIndex.value = nextZIndex()
  isOpen.value = true
  emit('visible-change', true)
}

const handleSelect = (command: string | number) => {
  emit('command', command)
  if (props.closeOnClick) closeAndRestore()
}

provide<JeDropdownContext>(jeDropdownKey, { handleSelect, close })

const onTriggerClick = () => {
  if (props.disabled) return
  if (isOpen.value) close()
  else open()
}

const onTriggerKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!isOpen.value) open()
    nextTick(() => moveFocus(event.key === 'ArrowDown' ? 1 : -1))
  } else if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    close()
  }
}

const onMenuKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveFocus(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveFocus(-1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      // 交给子项自己的点击逻辑，选中 / 关闭只有一条路径
      ;(document.activeElement as HTMLElement | null)?.click()
      break
    case 'Escape':
      event.preventDefault()
      event.stopPropagation()
      closeAndRestore()
      break
    case 'Tab':
      close()
      break
  }
}

// 窄屏没有 hover，点击切换；桌面端也允许点外部关闭
useClickOutside([rootRef, panelRef], () => {
  if (!isOpen.value) return
  close()
})

// 悬停触发时留一点延迟，鼠标从触发区移到菜单途中不会误收起
let closeTimer: ReturnType<typeof setTimeout> | null = null

const clearCloseTimer = () => {
  if (closeTimer !== null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

const scheduleClose = () => {
  clearCloseTimer()
  closeTimer = setTimeout(() => {
    closeTimer = null
    close()
  }, 120)
}

const onTriggerEnter = () => {
  if (isMobile.value || props.trigger !== 'hover' || props.disabled) return
  clearCloseTimer()
  open()
}

const onRootLeave = () => {
  if (isMobile.value || props.trigger !== 'hover' || !isOpen.value) return
  scheduleClose()
}

const onPanelEnter = () => {
  if (isMobile.value || props.trigger !== 'hover') return
  clearCloseTimer()
}

const onPanelLeave = () => {
  if (isMobile.value || props.trigger !== 'hover' || !isOpen.value) return
  scheduleClose()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isOpen.value) return
  event.stopPropagation()
  closeAndRestore()
}

watch(isOpen, (value) => {
  if (value) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})

watch(
  () => props.disabled,
  (value) => {
    if (value) close()
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  clearCloseTimer()
})
</script>

<template>
  <div
    ref="rootRef"
    class="je-dropdown"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled, 'je-dropdown--split': splitButton }"
    @mouseleave="onRootLeave"
  >
    <!-- 分裂按钮：主区域由业务自己放按钮，右侧箭头单独负责展开 -->
    <template v-if="splitButton">
      <div class="je-dropdown__main"><slot name="trigger" /></div>
      <button
        type="button"
        class="je-dropdown__caret"
        data-je-dropdown-trigger
        :disabled="disabled"
        aria-haspopup="menu"
        :aria-expanded="isOpen"
        :aria-controls="uid"
        aria-label="展开菜单"
        @click="onTriggerClick"
        @keydown="onTriggerKeydown"
        @mouseenter="onTriggerEnter"
      >
        <JeIcon name="chevron-down" :size="16" />
      </button>
    </template>

    <button
      v-else
      type="button"
      class="je-dropdown__trigger"
      data-je-dropdown-trigger
      :disabled="disabled"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-controls="uid"
      @click="onTriggerClick"
      @keydown="onTriggerKeydown"
      @mouseenter="onTriggerEnter"
    >
      <span class="je-dropdown__label"><slot name="trigger" /></span>
      <JeIcon class="je-dropdown__caret-icon" name="chevron-down" :size="16" />
    </button>

    <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
      <div
        v-if="isMobile"
        class="je-dropdown__scrim"
        :class="{ 'is-open': isOpen }"
        aria-hidden="true"
        @click="close()"
      />

      <div
        ref="panelRef"
        class="je-dropdown__panel"
        :class="{ 'is-open': isOpen }"
        :style="panelStyle"
        @mouseenter="onPanelEnter"
        @mouseleave="onPanelLeave"
      >
        <div
          v-if="isMobile"
          class="je-dropdown__handle"
          aria-hidden="true"
          @pointerdown="sheet.onPointerDown"
          @pointermove="sheet.onPointerMove"
          @pointerup="sheet.onPointerUp"
          @pointercancel="sheet.onPointerUp"
        />

        <div
          :id="uid"
          ref="menuRef"
          class="je-dropdown__menu"
          :style="listStyle"
          role="menu"
          :aria-hidden="!isOpen"
          @keydown="onMenuKeydown"
        >
          <slot />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-dropdown {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  font-family: inherit;
}

.je-dropdown--split {
  gap: 0;
}

.je-dropdown__main {
  display: inline-flex;
}

.je-dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  padding: 10px 14px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--je-text-muted);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  cursor: pointer;
  outline: none;
  transition: color var(--je-duration) ease, background var(--je-duration) ease,
    border-color var(--je-duration) ease;
}

.je-dropdown__trigger:hover,
.je-dropdown.is-open .je-dropdown__trigger {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-dropdown__trigger:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-dropdown__label {
  display: inline-flex;
  align-items: center;
}

.je-dropdown__caret-icon,
.je-dropdown__caret {
  color: var(--je-text-faint);
  transition: transform 0.32s var(--je-ease-overshoot), color var(--je-duration) ease;
}

.je-dropdown__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 34px;
  padding: 0 9px;
  font-family: inherit;
  background: var(--je-surface);
  border: var(--je-border);
  border-left: none;
  border-radius: 0 var(--je-radius) var(--je-radius) 0;
  cursor: pointer;
  outline: none;
  transition: background var(--je-duration) ease;
}

.je-dropdown__caret:hover {
  background: var(--je-surface-hover);
}

.je-dropdown__caret:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 展开时箭头翻个身 */
.je-dropdown.is-open .je-dropdown__caret-icon,
.je-dropdown.is-open .je-dropdown__caret {
  color: var(--je-text);
  transform: rotate(180deg);
}

.je-dropdown__main :deep(.je-button) {
  border-radius: var(--je-radius) 0 0 var(--je-radius);
}

.je-dropdown.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.je-dropdown__panel {
  position: fixed;
  z-index: 2000;
  box-sizing: border-box;
  min-width: 140px;
  max-width: calc(100vw - 24px);
  padding: 6px;
  font-family: inherit;
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius);
  box-shadow: var(--je-shadow-popup);
  /* 常驻 DOM、用 visibility 收起，否则量不到尺寸 */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  will-change: transform, opacity;
  transform: scale(0.94);
  transform-origin: top center;
  transition: transform 0.24s ease-in, opacity 0.18s ease-in, visibility 0s linear 0.24s;
}

.je-dropdown__panel.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: scale(1);
  transition: transform 0.32s var(--je-ease-out-back), opacity 0.2s ease-out;
}

.je-dropdown__menu {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.je-dropdown__scrim {
  position: fixed;
  inset: 0;
  z-index: 1999;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-dropdown__scrim.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-dropdown__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  touch-action: none;
}

.je-dropdown__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

/* 窄屏：底部弹出层，锁滚动、可下拉关闭、预留安全区 */
@media (max-width: 768px) {
  .je-dropdown__panel {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    min-width: 0;
    max-width: 100%;
    padding: 4px 12px calc(14px + env(safe-area-inset-bottom, 0px));
    border-bottom: none;
    border-radius: 22px 22px 0 0;
    transform-origin: bottom center;
    /* 列表在触屏上要能滚动，所以这里不能设 touch-action: none */
    transform: translateY(100%);
    transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
  }

  .je-dropdown__panel.is-open {
    transform: translateY(0);
    transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
  }

  .je-dropdown__menu {
    max-height: 62vh;
  }

  .je-dropdown__trigger,
  .je-dropdown__caret {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-dropdown__panel,
  .je-dropdown__panel.is-open,
  .je-dropdown__scrim,
  .je-dropdown__caret,
  .je-dropdown__caret-icon {
    transition: none;
  }
}
</style>
