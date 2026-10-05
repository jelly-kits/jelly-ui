<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { nextZIndex } from '../../core/useZIndex'
import type { JePlacementValue } from '../../core/useFloating'
import type { JePopoverTrigger } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JePopover' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    /** 桌面端触发方式；窄屏一律改为点击切换 */
    trigger?: JePopoverTrigger
    placement?: JePlacementValue
    title?: string
    /** 数字按 px 处理；窄屏会收缩到视口内 */
    width?: string | number
    disabled?: boolean
    /** 与触发元素的间距 */
    offset?: number
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: false,
    trigger: 'hover',
    placement: 'bottom',
    title: '',
    width: 260,
    disabled: false,
    offset: 10,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  show: []
  hide: []
}>()

const uid = useId()
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const isOpen = ref(props.modelValue)
const zIndex = ref(nextZIndex())

const isMobile = useIsMobile()

const { x, y, placement: actualPlacement, arrowCross } = useFloating({
  reference: triggerRef,
  floating: panelRef,
  open: isOpen,
  placement: () => props.placement,
  offset: props.offset,
})

/** 翻转后实际落位的那条边，用来决定箭头朝向与缩放原点 */
const side = computed(() => actualPlacement.value.split('-')[0])

const panelStyle = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
}))

const arrowStyle = computed(() =>
  side.value === 'top' || side.value === 'bottom'
    ? { left: `${arrowCross.value}px` }
    : { top: `${arrowCross.value}px` },
)

let openTimer: ReturnType<typeof setTimeout> | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null

const clearTimers = () => {
  if (openTimer !== null) {
    clearTimeout(openTimer)
    openTimer = null
  }
  if (closeTimer !== null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

const open = () => {
  if (props.disabled || isOpen.value) return
  clearTimers()
  zIndex.value = nextZIndex()
  isOpen.value = true
  emit('update:modelValue', true)
  emit('show')
}

const close = () => {
  if (!isOpen.value) return
  clearTimers()
  isOpen.value = false
  emit('update:modelValue', false)
  emit('hide')
}

/** 悬停进出都留一点缓冲，鼠标掠过时不会反复闪 */
const scheduleOpen = () => {
  clearTimers()
  openTimer = setTimeout(() => {
    openTimer = null
    open()
  }, 80)
}

const scheduleClose = () => {
  clearTimers()
  closeTimer = setTimeout(() => {
    closeTimer = null
    close()
  }, 80)
}

watch(
  () => props.modelValue,
  (value) => {
    if (value === isOpen.value) return
    if (value) {
      zIndex.value = nextZIndex()
      isOpen.value = true
      emit('show')
    } else {
      isOpen.value = false
      emit('hide')
    }
  },
)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isOpen.value) return
  event.stopPropagation()
  close()
  triggerRef.value?.focus()
}

watch(isOpen, (value) => {
  if (value) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})

const onTriggerEnter = () => {
  if (isMobile.value || props.trigger !== 'hover' || props.disabled) return
  scheduleOpen()
}

const onTriggerLeave = () => {
  if (isMobile.value || props.trigger !== 'hover') return
  scheduleClose()
}

const onPanelEnter = () => {
  if (!isMobile.value) clearTimers()
}

const onPanelLeave = () => {
  if (!isMobile.value && props.trigger === 'hover') scheduleClose()
}

/** 桌面端点击触发才切换；悬停触发时点击不介入，避免干扰触发元素自身行为 */
const onTriggerClick = () => {
  if (props.disabled) return
  if (!isMobile.value && props.trigger !== 'click') return
  if (isOpen.value) close()
  else open()
}

const onFocusOut = (event: FocusEvent) => {
  if (!isOpen.value) return
  const next = event.relatedTarget as Node | null
  // relatedTarget 为 null 说明焦点落到了不可聚焦处（鼠标点击面板文本），此时不应收起
  if (!next) return
  if (triggerRef.value?.contains(next) || panelRef.value?.contains(next)) return
  close()
}

useClickOutside([triggerRef, panelRef], () => {
  if (!isOpen.value) return
  close()
})

onBeforeUnmount(() => {
  clearTimers()
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <span
    ref="triggerRef"
    class="je-popover__trigger"
    :aria-expanded="isOpen"
    :aria-controls="uid"
    @mouseenter="onTriggerEnter"
    @mouseleave="onTriggerLeave"
    @focusin="onTriggerEnter"
    @focusout="onFocusOut"
    @click="onTriggerClick"
  >
    <slot />
  </span>

  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div
      :id="uid"
      ref="panelRef"
      class="je-popover__panel"
      :class="[`is-${side}`, { 'is-open': isOpen }]"
      :style="panelStyle"
      role="dialog"
      :aria-labelledby="title ? `${uid}-title` : undefined"
      :aria-hidden="!isOpen"
      @mouseenter="onPanelEnter"
      @mouseleave="onPanelLeave"
      @focusout="onFocusOut"
    >
      <div v-if="title || $slots.title" :id="`${uid}-title`" class="je-popover__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="je-popover__content">
        <slot name="content" />
      </div>
      <span class="je-popover__arrow" :style="arrowStyle" aria-hidden="true" />
    </div>
  </Teleport>
</template>

<style scoped>
.je-popover__trigger {
  display: inline-flex;
  align-items: center;
  font-family: inherit;
}

.je-popover__panel {
  position: fixed;
  z-index: 2000;
  box-sizing: border-box;
  max-width: calc(100vw - 24px);
  padding: 14px 16px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius);
  box-shadow: var(--je-shadow-popup);
  /* 收起态用 visibility 常驻 DOM，否则量不到尺寸、定位会错位 */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  will-change: transform, opacity;
  transform: scale(0.92);
  transition: transform 0.24s ease-in, opacity 0.18s ease-in, visibility 0s linear 0.24s;
}

.je-popover__panel.is-open {
  opacity: 1;
  visibility: visible;
  /* 面板内容可交互（按钮 / 输入框等） */
  pointer-events: auto;
  transform: scale(1);
  transition: transform 0.32s var(--je-ease-out-back), opacity 0.2s ease-out;
}

.je-popover__panel.is-top {
  transform-origin: bottom center;
}

.je-popover__panel.is-bottom {
  transform-origin: top center;
}

.je-popover__panel.is-left {
  transform-origin: right center;
}

.je-popover__panel.is-right {
  transform-origin: left center;
}

.je-popover__title {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--je-text);
}

.je-popover__content {
  color: var(--je-text-muted);
  word-break: break-word;
}

/* 箭头：旋转 45° 的小方块，只留朝外的两条边 */
.je-popover__arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--je-popup);
  border: 1px solid var(--je-border-color);
}

.je-popover__panel.is-top .je-popover__arrow {
  bottom: -6px;
  transform: translateX(-50%) rotate(45deg);
  border-top: none;
  border-left: none;
}

.je-popover__panel.is-bottom .je-popover__arrow {
  top: -6px;
  transform: translateX(-50%) rotate(45deg);
  border-right: none;
  border-bottom: none;
}

.je-popover__panel.is-left .je-popover__arrow {
  right: -6px;
  transform: translateY(-50%) rotate(45deg);
  border-bottom: none;
  border-left: none;
}

.je-popover__panel.is-right .je-popover__arrow {
  left: -6px;
  transform: translateY(-50%) rotate(45deg);
  border-top: none;
  border-right: none;
}

/* 窄屏没有 hover：改为点击切换，面板宽度收敛到视口内 */
@media (max-width: 768px) {
  .je-popover__panel {
    max-width: calc(100vw - 24px);
    padding: 14px 16px;
    font-size: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-popover__panel,
  .je-popover__panel.is-open {
    transition: none;
  }
}
</style>
