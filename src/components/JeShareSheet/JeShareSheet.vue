<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFocusTrap } from '../../core/useFocusTrap'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import JeIcon from '../JeIcon/JeIcon.vue'
import JeScrollbar from '../JeScrollbar/JeScrollbar.vue'
import { useJeLocale } from '../JeLocale'
import type { JeShareOption } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeShareSheet' })

const props = withDefaults(
  defineProps<{
    /** 显示 / 隐藏 */
    modelValue?: boolean
    /** 分享目标列表 */
    options?: JeShareOption[]
    /** 面板标题，缺省取语言包 shareSheet.title */
    title?: string
    /** 标题下方的说明文字 */
    description?: string
    /** 取消按钮文字，缺省取语言包；传空字符串则不显示取消按钮 */
    cancelText?: string
    /** 点击遮罩关闭 */
    closeOnClickOverlay?: boolean
    /** 底部预留安全区 */
    safeAreaInsetBottom?: boolean
    /** 展开 / 收起过渡时长，单位毫秒 */
    duration?: number
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: false,
    options: () => [],
    title: undefined,
    description: undefined,
    cancelText: undefined,
    closeOnClickOverlay: true,
    safeAreaInsetBottom: true,
    duration: 300,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 选中某个分享目标 */
  select: [option: JeShareOption, index: number]
  /** 点了取消或遮罩 */
  cancel: []
  /** 面板开始展开 */
  open: []
  /** 面板开始收起 */
  close: []
}>()

const { t } = useJeLocale()

const titleText = computed(() => props.title ?? t('shareSheet.title'))
const cancelLabel = computed(() => props.cancelText ?? t('shareSheet.cancel'))

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
  if (props.closeOnClickOverlay) onCancel()
}

const onDismiss = () => {
  drag.reset()
  onCancel()
}

/* 抓手下拉关闭：位移只做视觉反馈，松手超过阈值才真正收起 */
const drag = useSheetDrag(onDismiss, 96)

/** 拖拽时用内联 transform 覆盖面板的滑入位移，松手后交还给 CSS 过渡 */
const panelStyle = computed(() => ({
  zIndex: zIndex.value,
  '--je-share-sheet-duration': `${props.duration}ms`,
  '--je-share-sheet-safe-bottom': props.safeAreaInsetBottom
    ? 'env(safe-area-inset-bottom, 0px)'
    : '0px',
  transform:
    drag.dragging.value || drag.offset.value
      ? `translateY(${drag.offset.value}px)`
      : undefined,
}))

/** 内置色组：未指定 color 的目标按索引取用 */
const FALLBACK_COLORS = [
  'var(--je-primary)',
  'var(--je-success)',
  'var(--je-warning)',
  'var(--je-info)',
  'var(--je-danger)',
  'var(--je-primary-end)',
]

const colorOf = (option: JeShareOption, index: number) =>
  option.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? 'var(--je-primary)'

/** 图标底色由底色现算，图标颜色缺省与底色一致 */
const iconStyle = (option: JeShareOption, index: number) => {
  const color = colorOf(option, index)
  return {
    '--je-share-sheet-color': color,
    '--je-share-sheet-icon-color': option.iconColor ?? color,
  }
}

const onSelect = (option: JeShareOption, index: number) => {
  if (option.disabled) return
  emit('select', option, index)
  close()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      // 每次由隐藏转可见都重新取层级，保证后开的浮层压在上面
      zIndex.value = nextZIndex()
      emit('open')
    }
  },
  { immediate: true },
)
</script>

<template>
  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div class="je-share-sheet" :class="{ 'is-open': modelValue }">
      <div class="je-share-sheet__scrim" aria-hidden="true" @click="onScrimClick" />

      <div
        ref="panelRef"
        class="je-share-sheet__panel"
        :style="panelStyle"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-label="titleText || undefined"
        :aria-hidden="!modelValue"
      >
        <div
          class="je-share-sheet__grabber-area"
          @pointerdown="drag.onPointerDown"
          @pointermove="drag.onPointerMove"
          @pointerup="drag.onPointerUp"
          @pointercancel="drag.onPointerUp"
        >
          <span class="je-share-sheet__grabber" aria-hidden="true" />
        </div>

        <div v-if="titleText || description || $slots.header" class="je-share-sheet__header">
          <slot name="header">
            <h2 v-if="titleText" class="je-share-sheet__title">{{ titleText }}</h2>
            <p v-if="description" class="je-share-sheet__description">{{ description }}</p>
          </slot>
        </div>

        <div class="je-share-sheet__content">
          <JeScrollbar>
            <slot>
              <div class="je-share-sheet__grid" role="menu">
                <button
                  v-for="(option, index) in options"
                  :key="option.name"
                  type="button"
                  role="menuitem"
                  class="je-share-sheet__option"
                  :class="{ 'is-disabled': option.disabled }"
                  :disabled="option.disabled"
                  @click="onSelect(option, index)"
                >
                  <span class="je-share-sheet__icon" :style="iconStyle(option, index)">
                    <JeIcon :name="option.icon ?? 'share'" :size="22" />
                  </span>
                  <span class="je-share-sheet__name">{{ option.name }}</span>
                </button>
              </div>
            </slot>
          </JeScrollbar>
        </div>

        <button v-if="cancelLabel" type="button" class="je-share-sheet__cancel" @click="onCancel">
          {{ cancelLabel }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.je-share-sheet {
  position: fixed;
  inset: 0;
  /* 容器常驻 DOM 且铺满视口，收起时必须放行点击，否则会盖死整页 */
  pointer-events: none;
  --je-share-sheet-duration: 300ms;
}

.je-share-sheet.is-open {
  pointer-events: auto;
}

.je-share-sheet__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-share-sheet.is-open .je-share-sheet__scrim {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-share-sheet__panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-height: 80vh;
  padding-bottom: var(--je-share-sheet-safe-bottom, 0px);
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
  transition: transform var(--je-share-sheet-duration) ease-in, opacity 0.22s ease-in,
    visibility 0s linear var(--je-share-sheet-duration);
}

.je-share-sheet.is-open .je-share-sheet__panel {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: transform var(--je-share-sheet-duration) var(--je-ease-out-back), opacity 0.24s ease-out;
}

/* 抓手是独立的手势元素，可以独占 touch-action */
.je-share-sheet__grabber-area {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 10px 0 6px;
  cursor: grab;
  touch-action: none;
}

.je-share-sheet__grabber {
  width: 36px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

.je-share-sheet__header {
  flex-shrink: 0;
  padding: 6px 22px 10px;
  text-align: center;
}

.je-share-sheet__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.je-share-sheet__description {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--je-text-faint);
}

.je-share-sheet__content {
  flex: 1 1 auto;
  min-height: 0;
}

.je-share-sheet__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 8px 12px 18px;
}

.je-share-sheet__option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-height: 44px;
  padding: 10px 6px;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.35;
  color: var(--je-text-muted);
  text-align: center;
  background: transparent;
  border: none;
  border-radius: var(--je-radius);
  cursor: pointer;
  outline: none;
  transition: background var(--je-duration) ease;
}

.je-share-sheet__option:not(.is-disabled):hover {
  background: var(--je-surface-hover);
}

.je-share-sheet__option:not(.is-disabled):active {
  background: color-mix(in srgb, var(--je-primary) 14%, transparent);
}

.je-share-sheet__option:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

.je-share-sheet__option.is-disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.je-share-sheet__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 0;
  color: var(--je-share-sheet-icon-color, var(--je-primary));
  /* 由目标底色现算的淡色圆底，换肤时会跟着变 */
  background: color-mix(in srgb, var(--je-share-sheet-color, var(--je-primary)) 20%, transparent);
  border-radius: 50%;
  transition: transform var(--je-duration) var(--je-ease-out-back);
}

.je-share-sheet__option:not(.is-disabled):active .je-share-sheet__icon {
  transform: scale(0.92);
}

.je-share-sheet__name {
  overflow-wrap: anywhere;
}

.je-share-sheet__cancel {
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100%;
  min-height: 52px;
  padding: 14px 16px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  color: var(--je-text);
  background: var(--je-popup);
  border: none;
  border-top: var(--je-border);
  cursor: pointer;
  outline: none;
  transition: background var(--je-duration) ease;
}

.je-share-sheet__cancel:hover {
  background: var(--je-surface-hover);
}

.je-share-sheet__cancel:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

@media (max-width: 360px) {
  .je-share-sheet__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .je-share-sheet__cancel {
    min-height: 56px;
  }
}

@media (prefers-reduced-motion: reduce) {
  /*
   * 展开态的规则特异性更高（.je-share-sheet.is-open .je-share-sheet__panel），
   * 只写基础类会被它反压、过渡照样跑，必须把 .is-open 一起列进来（见 AGENTS 陷阱 5）。
   */
  .je-share-sheet__scrim,
  .je-share-sheet__panel,
  .je-share-sheet.is-open .je-share-sheet__scrim,
  .je-share-sheet.is-open .je-share-sheet__panel,
  .je-share-sheet__icon {
    transition: none;
  }
}
</style>