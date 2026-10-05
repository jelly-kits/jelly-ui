<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import { JeIcon } from '../JeIcon'
import { JeTree, type JeTreeNode } from '../JeTree'
import type { JeTreeSelectValue } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeTreeSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: JeTreeSelectValue
    data: JeTreeNode[]
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    accordion?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: null,
    placeholder: '请选择',
    disabled: false,
    clearable: true,
    accordion: false,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: JeTreeSelectValue]
  change: [value: JeTreeSelectValue]
  clear: []
}>()

const uid = useId()
const panelId = `${uid}-panel`
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const zIndex = ref(nextZIndex())
const triggerWidth = ref(0)

/** 窄屏切底部弹出层：锁滚动、可下拉关闭 */
const isMobile = useIsMobile()
const locked = computed(() => isMobile.value && isOpen.value)
useScrollLock(locked)
const sheet = useSheetDrag(() => close())

const { x, y } = useFloating({
  reference: triggerRef,
  floating: panelRef,
  open: isOpen,
  placement: () => 'bottom-start',
  offset: 8,
})

useClickOutside([rootRef, panelRef], () => close())

const panelStyle = computed<Record<string, string | number> | undefined>(() => {
  if (isMobile.value) {
    if (!isOpen.value) return undefined
    const style: Record<string, string | number> = {
      transform: `translateY(${sheet.offset.value}px)`,
    }
    // 拖动过程中不要过渡，松手后交回 CSS
    if (sheet.dragging.value) style.transition = 'none'
    return style
  }
  const style: Record<string, string | number> = {
    left: `${x.value}px`,
    top: `${y.value}px`,
    zIndex: zIndex.value,
  }
  if (triggerWidth.value > 0) style.width = `${triggerWidth.value}px`
  return style
})

const selectedKeys = computed<Array<string | number>>(() =>
  props.modelValue === null || props.modelValue === undefined ? [] : [props.modelValue],
)

/** 在 data 里深度查找选中节点，拿到用于展示的 label */
const findLabel = (nodes: JeTreeNode[], key: string | number): string | null => {
  for (const node of nodes) {
    if (node.key === key) return node.label
    if (node.children) {
      const found = findLabel(node.children, key)
      if (found !== null) return found
    }
  }
  return null
}

const selectedLabel = computed(() =>
  props.modelValue === null || props.modelValue === undefined
    ? ''
    : findLabel(props.data, props.modelValue) ?? '',
)
const hasValue = computed(() => selectedLabel.value !== '')

const open = () => {
  if (props.disabled) return
  sheet.reset()
  zIndex.value = nextZIndex()
  triggerWidth.value = triggerRef.value?.offsetWidth ?? 0
  isOpen.value = true
  // 桌面端把焦点送进树里，随后方向键 / 回车才可用
  if (!isMobile.value) {
    nextTick(() => {
      panelRef.value?.querySelector<HTMLElement>('[role="treeitem"]')?.focus()
    })
  }
}

const close = () => {
  if (!isOpen.value) return
  isOpen.value = false
}

const toggle = () => {
  if (props.disabled) return
  if (isOpen.value) close()
  else open()
}

const selectNode = (node: JeTreeNode) => {
  if (node.disabled) return
  emit('update:modelValue', node.key)
  emit('change', node.key)
  close()
  triggerRef.value?.focus()
}

const clear = () => {
  if (props.disabled) return
  emit('update:modelValue', null)
  emit('change', null)
  emit('clear')
}

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return

  if (event.key === 'Escape') {
    if (!isOpen.value) return
    event.preventDefault()
    close()
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (isOpen.value) close()
    else open()
  }
}

/** 面板可能被传送到 body，键盘事件到不了根节点，单独收一遍 Escape */
const onPanelKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isOpen.value) return
  event.preventDefault()
  close()
  triggerRef.value?.focus()
}
</script>

<template>
  <div
    ref="rootRef"
    class="je-tree-select"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
    @keydown="onKeydown"
  >
    <div
      ref="triggerRef"
      class="je-tree-select__trigger"
      :class="{ 'has-value': hasValue }"
      role="combobox"
      aria-haspopup="tree"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      :tabindex="disabled ? -1 : 0"
      @click="toggle"
    >
      <span class="je-tree-select__label">{{ hasValue ? selectedLabel : placeholder }}</span>

      <button
        v-if="clearable && hasValue && !disabled"
        type="button"
        class="je-tree-select__clear"
        aria-label="清除选择"
        @click.stop="clear"
      >
        <JeIcon name="close" :size="14" />
      </button>

      <span class="je-tree-select__arrow" aria-hidden="true" />
    </div>

    <Teleport
      :to="teleportTarget === false ? 'body' : teleportTarget"
      :disabled="!isMobile || teleportTarget === false"
    >
      <div
        v-if="isMobile"
        class="je-tree-select__scrim"
        :class="{ 'is-open': isOpen }"
        aria-hidden="true"
        @click="close"
      />

      <div
        :id="panelId"
        ref="panelRef"
        class="je-tree-select__panel"
        :class="{ 'is-open': isOpen }"
        :style="panelStyle"
        @keydown="onPanelKeydown"
      >
        <div
          v-if="isMobile"
          class="je-tree-select__handle"
          aria-hidden="true"
          @pointerdown="sheet.onPointerDown"
          @pointermove="sheet.onPointerMove"
          @pointerup="sheet.onPointerUp"
          @pointercancel="sheet.onPointerUp"
        />

        <div class="je-tree-select__body">
          <JeTree
            :data="data"
            :model-value="selectedKeys"
            :accordion="accordion"
            :expand-on-click-node="false"
            @node-click="selectNode"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-tree-select {
  position: relative;
  font-family: inherit;
  user-select: none;
}

.je-tree-select__trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  min-height: 44px;
  padding: 12px 16px;
  font-size: 15px;
  color: var(--je-text-faint);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  cursor: pointer;
  outline: none;
  transition: border-color var(--je-duration) ease, background var(--je-duration) ease,
    box-shadow var(--je-duration) ease;
}

.je-tree-select__trigger.has-value {
  color: var(--je-text);
}

/* 聚焦与展开共用高亮，键盘用户也看得见 */
.je-tree-select__trigger:focus-visible,
.je-tree-select.is-open .je-tree-select__trigger {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-tree-select__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-tree-select__clear {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--je-text-faint);
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.je-tree-select__clear:hover,
.je-tree-select__clear:focus-visible {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

/* 箭头是 CSS 画的小折角，展开时翻转 */
.je-tree-select__arrow {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  margin-top: -4px;
  border-right: 2px solid var(--je-text-faint);
  border-bottom: 2px solid var(--je-text-faint);
  transform: rotate(45deg);
  transition: transform 0.4s var(--je-ease-overshoot), margin-top 0.4s var(--je-ease-overshoot),
    border-color var(--je-duration) ease;
}

.je-tree-select.is-open .je-tree-select__arrow {
  margin-top: 4px;
  border-color: var(--je-text);
  transform: rotate(-135deg);
}

.je-tree-select.is-disabled .je-tree-select__trigger {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-tree-select__panel {
  position: fixed;
  z-index: 50;
  box-sizing: border-box;
  max-height: 320px;
  padding: 6px;
  overflow-y: auto;
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius);
  box-shadow: var(--je-shadow-popup);
  transform-origin: top left;
  /* 收起态：常驻 DOM 但不可见、不可点，保证过渡可用 */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  will-change: transform, opacity;
  transform: scale(0.96) translateY(-6px);
  transition: transform 0.28s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.28s;
}

.je-tree-select__panel.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: scale(1) translateY(0);
  transition: transform 0.38s var(--je-ease-out-back), opacity 0.24s ease-out;
}

.je-tree-select__scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-tree-select__scrim.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-tree-select__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  touch-action: none;
}

.je-tree-select__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

/* 窄屏：改成贴底弹出的抽屉，并预留给安全区；树本身照常可滚动 */
@media (max-width: 768px) {
  .je-tree-select__panel {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 101;
    max-height: 72vh;
    padding: 4px 12px calc(14px + env(safe-area-inset-bottom, 0px));
    border-radius: 22px 22px 0 0;
    border-bottom: none;
    transform-origin: bottom center;
    transform: translateY(100%);
    transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
  }

  .je-tree-select__panel.is-open {
    transform: translateY(0);
    transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-tree-select__panel,
  .je-tree-select__panel.is-open,
  .je-tree-select__scrim,
  .je-tree-select__arrow {
    transition: none;
  }
}
</style>
