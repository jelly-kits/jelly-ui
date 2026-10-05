<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import { useFocusTrap } from '../../core/useFocusTrap'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import type { JeActionSheetAction } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeActionSheet' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    /** 操作项列表 */
    actions?: JeActionSheetAction[]
    /** 面板标题 */
    title?: string
    /** 标题下方的说明文字 */
    description?: string
    /** 取消按钮文字，传空字符串则不显示取消按钮 */
    cancelText?: string
    /** 点击操作项后自动关闭 */
    closeOnClickAction?: boolean
    /** 点击遮罩关闭 */
    closeOnClickModal?: boolean
    /** 按 Esc 关闭 */
    closeOnEscape?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: false,
    actions: () => [],
    title: undefined,
    description: undefined,
    cancelText: '取消',
    closeOnClickAction: true,
    closeOnClickModal: true,
    closeOnEscape: true,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 选中某个操作项 */
  select: [action: JeActionSheetAction, index: number]
  /** 点了取消或遮罩 */
  cancel: []
  open: []
  close: []
}>()

const panelRef = ref<HTMLElement | null>(null)
const zIndex = ref(nextZIndex())

const locked = computed(() => props.modelValue)
useScrollLock(locked)
useFocusTrap(panelRef, locked)

const close = () => {
  if (!props.modelValue) return
  emit('update:modelValue', false)
  emit('close')
}

const onCancel = () => {
  emit('cancel')
  close()
}

const onScrimClick = () => {
  if (props.closeOnClickModal) onCancel()
}

const onDismiss = () => {
  drag.reset()
  onCancel()
}

/* 抓手下拉关闭：位移只做视觉反馈，松手超过阈值才真正收起 */
const drag = useSheetDrag(onDismiss, 96)

/** 拖拽时用内联 transform 覆盖面板的滑入位移，松手后交还给 CSS 过渡 */
const panelStyle = computed(() => {
  const base = { zIndex: zIndex.value }
  if (!drag.dragging.value && !drag.offset.value) return base
  return { ...base, transform: `translateY(${drag.offset.value}px)` }
})

const onSelect = (action: JeActionSheetAction, index: number) => {
  if (action.disabled || action.loading) return
  emit('select', action, index)
  if (props.closeOnClickAction) close()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !props.closeOnEscape) return
  event.stopPropagation()
  onCancel()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      zIndex.value = nextZIndex()
      emit('open')
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)
</script>

<template>
  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div class="je-action-sheet" :class="{ 'is-open': modelValue }">
      <div class="je-action-sheet__scrim" aria-hidden="true" @click="onScrimClick" />

      <div
        ref="panelRef"
        class="je-action-sheet__panel"
        :style="panelStyle"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-label="title || undefined"
        :aria-hidden="!modelValue"
      >
        <div
          class="je-action-sheet__grabber-area"
          @pointerdown="drag.onPointerDown"
          @pointermove="drag.onPointerMove"
          @pointerup="drag.onPointerUp"
          @pointercancel="drag.onPointerUp"
        >
          <span class="je-action-sheet__grabber" aria-hidden="true" />
        </div>

        <div v-if="title || description || $slots.header" class="je-action-sheet__header">
          <slot name="header">
            <h2 v-if="title" class="je-action-sheet__title">{{ title }}</h2>
            <p v-if="description" class="je-action-sheet__description">{{ description }}</p>
          </slot>
        </div>

        <div class="je-action-sheet__content" role="menu">
          <slot>
            <button
              v-for="(action, index) in actions"
              :key="action.name"
              type="button"
              role="menuitem"
              class="je-action-sheet__item"
              :class="{ 'is-disabled': action.disabled || action.loading }"
              :style="action.color ? { color: action.color } : undefined"
              :disabled="action.disabled || action.loading"
              @click="onSelect(action, index)"
            >
              <JeIcon v-if="action.loading" class="je-action-sheet__spinner" name="loading" spin :size="18" />
              <JeIcon v-else-if="action.icon" :name="action.icon" :size="18" />
              <span class="je-action-sheet__item-main">
                <span class="je-action-sheet__item-text">{{ action.text ?? action.name }}</span>
                <span v-if="action.subText" class="je-action-sheet__item-sub">{{ action.subText }}</span>
              </span>
            </button>
          </slot>
        </div>

        <div v-if="cancelText" class="je-action-sheet__cancel-wrap">
          <button type="button" class="je-action-sheet__cancel" @click="onCancel">
            {{ cancelText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.je-action-sheet {
  position: fixed;
  inset: 0;
  z-index: 2000;
  /* 容器常驻 DOM 且铺满视口，收起时必须放行点击，否则会盖死整页 */
  pointer-events: none;
}

.je-action-sheet.is-open {
  pointer-events: auto;
}

.je-action-sheet__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-action-sheet.is-open .je-action-sheet__scrim {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-action-sheet__panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-height: 80vh;
  padding-bottom: env(safe-area-inset-bottom);
  font-family: inherit;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: var(--je-border);
  border-radius: var(--je-radius-lg) var(--je-radius-lg) 0 0;
  box-shadow: var(--je-shadow-popup);
  outline: none;
  /* 收起后必须屏蔽点击，否则过渡期间面板是「隐形可点」的 */
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateY(100%);
  transition: transform 0.3s ease-in, opacity 0.22s ease-in, visibility 0s linear 0.3s;
}

.je-action-sheet.is-open .je-action-sheet__panel {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
}

/* 抓手是独立的手势元素，可以独占 touch-action */
.je-action-sheet__grabber-area {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 10px 0 6px;
  cursor: grab;
  touch-action: none;
}

.je-action-sheet__grabber {
  width: 36px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

.je-action-sheet__header {
  flex-shrink: 0;
  padding: 6px 22px 16px;
  text-align: center;
}

.je-action-sheet__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.je-action-sheet__description {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--je-text-faint);
}

.je-action-sheet__content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.je-action-sheet__item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  min-height: 52px;
  padding: 12px 22px;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.4;
  color: var(--je-text);
  text-align: center;
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  transition: background var(--je-duration) ease;
}

.je-action-sheet__item + .je-action-sheet__item {
  border-top: var(--je-border);
}

.je-action-sheet__item:not(.is-disabled):hover {
  background: var(--je-surface-hover);
}

.je-action-sheet__item:not(.is-disabled):active {
  background: color-mix(in srgb, var(--je-primary) 14%, transparent);
}

.je-action-sheet__item:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

.je-action-sheet__item.is-disabled {
  color: var(--je-text-faint);
  cursor: not-allowed;
}

.je-action-sheet__spinner {
  color: var(--je-primary);
}

.je-action-sheet__item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.je-action-sheet__item-text {
  overflow-wrap: break-word;
}

.je-action-sheet__item-sub {
  font-size: 13px;
  line-height: 1.4;
  color: var(--je-text-faint);
}

/* 取消按钮与操作项之间留一条底色空档 */
.je-action-sheet__cancel-wrap {
  flex-shrink: 0;
  padding: 8px 8px 0;
  background: var(--je-surface);
}

.je-action-sheet__cancel {
  box-sizing: border-box;
  width: 100%;
  min-height: 52px;
  padding: 12px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  color: var(--je-text);
  background: var(--je-popup);
  border: none;
  border-radius: var(--je-radius-md);
  cursor: pointer;
  outline: none;
  transition: background var(--je-duration) ease;
}

.je-action-sheet__cancel:hover {
  background: var(--je-surface-hover);
}

.je-action-sheet__cancel:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

/*
 * 减弱动效时全部瞬切。
 * 必须把 .is-open 状态类也列进来：它的选择器特异性比单个基础类高，
 * 只写基础类的话状态规则里的 transition 会反压回来，减弱动效实际不生效。
 */
@media (prefers-reduced-motion: reduce) {
  .je-action-sheet__scrim,
  .je-action-sheet__panel,
  .je-action-sheet.is-open .je-action-sheet__scrim,
  .je-action-sheet.is-open .je-action-sheet__panel {
    transition: none;
  }
}
</style>
