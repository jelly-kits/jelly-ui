<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import { JeButton } from '../JeButton'
import type { JePopconfirmType } from './types'
import type { JePlacementValue } from '../../core/useFloating'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JePopconfirm' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    content?: string
    confirmText?: string
    cancelText?: string
    placement?: JePlacementValue
    /** 确认按钮语义色 */
    type?: JePopconfirmType
    /** 数字按 px 处理；窄屏固定为底部弹出层的整宽 */
    width?: string | number
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: false,
    title: '',
    content: '',
    confirmText: '确定',
    cancelText: '取消',
    placement: 'top',
    type: 'primary',
    width: 220,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const uid = useId()
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const isOpen = ref(props.modelValue)
const zIndex = ref(nextZIndex())

const isMobile = useIsMobile()
/** 窄屏才锁滚动，桌面端气泡不应打断页面滚动 */
const locked = computed(() => isMobile.value && isOpen.value)
useScrollLock(locked)

const sheet = useSheetDrag(() => close())

const { x, y, placement: actualPlacement, arrowCross } = useFloating({
  reference: triggerRef,
  floating: panelRef,
  open: isOpen,
  placement: () => props.placement,
  offset: 12,
})

const side = computed(() => actualPlacement.value.split('-')[0])

const panelStyle = computed(() => {
  const style: Record<string, string | number> = { zIndex: zIndex.value }
  if (isMobile.value) {
    if (isOpen.value) {
      style.transform = `translateY(${sheet.offset.value}px)`
      if (sheet.dragging.value) style.transition = 'none'
    }
    return style
  }
  style.left = `${x.value}px`
  style.top = `${y.value}px`
  style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  return style
})

const arrowStyle = computed(() =>
  side.value === 'top' || side.value === 'bottom'
    ? { left: `${arrowCross.value}px` }
    : { top: `${arrowCross.value}px` },
)

const open = () => {
  if (isOpen.value) return
  sheet.reset()
  zIndex.value = nextZIndex()
  isOpen.value = true
  emit('update:modelValue', true)
}

const close = () => {
  if (!isOpen.value) return
  isOpen.value = false
  emit('update:modelValue', false)
}

const toggle = () => {
  if (isOpen.value) close()
  else open()
}

const onConfirm = () => {
  emit('confirm')
  close()
}

const onCancel = () => {
  emit('cancel')
  close()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isOpen.value) return
  event.stopPropagation()
  close()
}

watch(isOpen, async (value) => {
  if (value) {
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    // 打开后把焦点移进面板，键盘用户可以直接 Tab / Esc
    panelRef.value?.focus()
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

watch(
  () => props.modelValue,
  (value) => {
    if (value === isOpen.value) return
    if (value) open()
    else close()
  },
)

useClickOutside([triggerRef, panelRef], () => {
  if (!isOpen.value) return
  close()
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <span
    ref="triggerRef"
    class="je-popconfirm__trigger"
    :aria-expanded="isOpen"
    :aria-controls="uid"
    @click="toggle"
  >
    <slot name="reference">
      <slot />
    </slot>
  </span>

  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div
      v-if="isMobile"
      class="je-popconfirm__scrim"
      :class="{ 'is-open': isOpen }"
      aria-hidden="true"
      @click="close()"
    />

    <div
      :id="uid"
      ref="panelRef"
      class="je-popconfirm__panel"
      :class="[`is-${side}`, `je-popconfirm--${type}`, { 'is-open': isOpen }]"
      :style="panelStyle"
      role="dialog"
      :aria-labelledby="title ? `${uid}-title` : undefined"
      tabindex="-1"
      :aria-hidden="!isOpen"
    >
      <div
        v-if="isMobile"
        class="je-popconfirm__handle"
        aria-hidden="true"
        @pointerdown="sheet.onPointerDown"
        @pointermove="sheet.onPointerMove"
        @pointerup="sheet.onPointerUp"
        @pointercancel="sheet.onPointerUp"
      />

      <div class="je-popconfirm__body">
        <p v-if="title" :id="`${uid}-title`" class="je-popconfirm__title">{{ title }}</p>
        <div class="je-popconfirm__content">
          <slot name="content">{{ content }}</slot>
        </div>
      </div>

      <div class="je-popconfirm__actions">
        <JeButton variant="ghost" @click="onCancel">{{ cancelText }}</JeButton>
        <JeButton @click="onConfirm">{{ confirmText }}</JeButton>
      </div>

      <span v-if="!isMobile" class="je-popconfirm__arrow" :style="arrowStyle" aria-hidden="true" />
    </div>
  </Teleport>
</template>

<style scoped>
.je-popconfirm__trigger {
  display: inline-flex;
  align-items: center;
  font-family: inherit;
}

.je-popconfirm__panel {
  position: fixed;
  z-index: 2000;
  box-sizing: border-box;
  max-width: calc(100vw - 24px);
  font-family: inherit;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius);
  box-shadow: var(--je-shadow-popup);
  outline: none;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  will-change: transform, opacity;
  transform: scale(0.92);
  transition: transform 0.24s ease-in, opacity 0.18s ease-in, visibility 0s linear 0.24s;
}

.je-popconfirm__panel.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: scale(1);
  transition: transform 0.32s var(--je-ease-out-back), opacity 0.2s ease-out;
}

.je-popconfirm__panel.is-top {
  transform-origin: bottom center;
}

.je-popconfirm__panel.is-bottom {
  transform-origin: top center;
}

.je-popconfirm__panel.is-left {
  transform-origin: right center;
}

.je-popconfirm__panel.is-right {
  transform-origin: left center;
}

.je-popconfirm__body {
  padding: 14px 16px 10px;
}

.je-popconfirm__title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
}

.je-popconfirm__content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--je-text-muted);
  word-break: break-word;
}

.je-popconfirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 12px 12px;
}

/* 气泡里空间有限，把 JeButton 收窄一档 */
.je-popconfirm__actions :deep(.je-button) {
  padding: 8px 14px;
  font-size: 13px;
  border-radius: var(--je-radius-sm);
}

/* 语义色：主色按钮换成对应语义色的渐变与光晕 */
.je-popconfirm--danger .je-popconfirm__actions :deep(.je-button--primary) {
  background: linear-gradient(
    135deg,
    var(--je-danger),
    color-mix(in srgb, var(--je-danger) 65%, #000)
  );
  box-shadow:
    0 8px 22px color-mix(in srgb, var(--je-danger) 40%, transparent),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
}

.je-popconfirm--warning .je-popconfirm__actions :deep(.je-button--primary) {
  color: #1f1300;
  background: linear-gradient(
    135deg,
    var(--je-warning),
    color-mix(in srgb, var(--je-warning) 70%, #000)
  );
  box-shadow:
    0 8px 22px color-mix(in srgb, var(--je-warning) 40%, transparent),
    inset 0 2px 4px rgba(255, 255, 255, 0.35);
}

.je-popconfirm__arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--je-popup);
  border: 1px solid var(--je-border-color);
}

.je-popconfirm__panel.is-top .je-popconfirm__arrow {
  bottom: -6px;
  transform: translateX(-50%) rotate(45deg);
  border-top: none;
  border-left: none;
}

.je-popconfirm__panel.is-bottom .je-popconfirm__arrow {
  top: -6px;
  transform: translateX(-50%) rotate(45deg);
  border-right: none;
  border-bottom: none;
}

.je-popconfirm__panel.is-left .je-popconfirm__arrow {
  right: -6px;
  transform: translateY(-50%) rotate(45deg);
  border-bottom: none;
  border-left: none;
}

.je-popconfirm__panel.is-right .je-popconfirm__arrow {
  left: -6px;
  transform: translateY(-50%) rotate(45deg);
  border-top: none;
  border-right: none;
}

.je-popconfirm__scrim {
  position: fixed;
  inset: 0;
  z-index: 1999;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-popconfirm__scrim.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-popconfirm__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  touch-action: none;
}

.je-popconfirm__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

/* 窄屏：改成贴底的确认弹层，锁滚动、可下拉关闭、预留安全区 */
@media (max-width: 768px) {
  .je-popconfirm__panel {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-width: 100%;
    padding-bottom: env(safe-area-inset-bottom);
    border-bottom: none;
    border-radius: var(--je-radius-lg) var(--je-radius-lg) 0 0;
    transform-origin: bottom center;
    transform: translateY(100%);
    transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
  }

  .je-popconfirm__panel.is-open {
    transform: translateY(0);
    transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
  }

  .je-popconfirm__body {
    padding: 4px 20px 18px;
  }

  .je-popconfirm__title {
    font-size: 16px;
  }

  .je-popconfirm__content {
    font-size: 15px;
  }

  .je-popconfirm__actions {
    gap: 12px;
    padding: 0 20px 20px;
  }

  /* 触屏热区不小于 44px */
  .je-popconfirm__actions :deep(.je-button) {
    flex: 1;
    min-height: 44px;
    padding: 12px 18px;
    font-size: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-popconfirm__panel,
  .je-popconfirm__panel.is-open,
  .je-popconfirm__scrim {
    transition: none;
  }
}
</style>
