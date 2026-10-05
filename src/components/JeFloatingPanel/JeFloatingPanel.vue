<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { nextZIndex } from '../../core/useZIndex'
import JeIcon from '../JeIcon/JeIcon.vue'
import JeScrollbar from '../JeScrollbar/JeScrollbar.vue'

defineOptions({ name: 'JeFloatingPanel' })

const props = withDefaults(
  defineProps<{
    /** 当前面板高度（px），配合 v-model 使用 */
    modelValue?: number
    /** 可吸附的高度档位（px），缺省为 100 与视口高度的 60% */
    anchors?: number[]
    /** 高度过渡时长，数字按秒处理，字符串原样使用 */
    duration?: number | string
    /** 是否可拖拽抓手调整高度 */
    draggable?: boolean
    /** 底部预留安全区 */
    safeAreaInsetBottom?: boolean
    /** 是否显示关闭按钮 */
    closeable?: boolean
    /** 面板标题 */
    title?: string
  }>(),
  {
    modelValue: undefined,
    anchors: () => [100, typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.6) : 400],
    duration: 0.3,
    draggable: true,
    safeAreaInsetBottom: true,
    closeable: false,
    title: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [height: number]
  /** 高度吸附落定后派发 */
  heightChange: [height: number]
  /** 点击关闭按钮 */
  close: []
}>()

/** 档位升序排列，最小 / 最大档位决定拖拽的夹取范围 */
const sortedAnchors = computed(() => [...props.anchors].sort((a, b) => a - b))
const minAnchor = computed(() => sortedAnchors.value[0] ?? 0)
const maxAnchor = computed(() => sortedAnchors.value[sortedAnchors.value.length - 1] ?? 0)

const clamp = (value: number) => Math.min(maxAnchor.value, Math.max(minAnchor.value, value))

/** 就近吸附到某个档位 */
const closestAnchor = (value: number) => {
  const list = sortedAnchors.value
  const first = list[0]
  if (first === undefined) return value
  return list.reduce(
    (best, anchor) => (Math.abs(anchor - value) < Math.abs(best - value) ? anchor : best),
    first,
  )
}

/** 初始高度：优先 v-model，其次第二个档位，再退回第一个档位 */
const initialHeight = () => {
  const list = sortedAnchors.value
  if (props.modelValue !== undefined) return clamp(props.modelValue)
  return list[1] ?? list[0] ?? 0
}

const height = ref(initialHeight())
const dragging = ref(false)
/** 非模态浮层，挂载时取一次层级即可 */
const zIndex = ref(nextZIndex())

let pointerId = -1
let startY = 0
let startHeight = 0

const rootStyle = computed(() => ({
  zIndex: zIndex.value,
  height: `${height.value}px`,
  // 拖拽过程中关掉过渡才能跟手，松手后交还给 CSS
  transition: dragging.value ? 'none' : undefined,
  '--je-floating-panel-duration':
    typeof props.duration === 'number' ? `${props.duration}s` : props.duration,
  '--je-floating-panel-safe-bottom': props.safeAreaInsetBottom
    ? 'env(safe-area-inset-bottom, 0px)'
    : '0px',
}))

const applyHeight = (value: number) => {
  height.value = Math.round(clamp(value))
}

/** 设置高度并吸附到最近档位，同时向上派发 */
const setHeight = (value: number) => {
  applyHeight(closestAnchor(value))
  emit('update:modelValue', height.value)
  emit('heightChange', height.value)
}

watch(
  () => props.modelValue,
  (value) => {
    if (value === undefined || dragging.value) return
    applyHeight(value)
  },
)

watch(sortedAnchors, () => applyHeight(height.value))

/* 拖拽只在抓手区触发，内容区保留原生滚动 */
const onPointerDown = (event: PointerEvent) => {
  if (!props.draggable) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  dragging.value = true
  pointerId = event.pointerId
  startY = event.clientY
  startHeight = height.value
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

const onPointerMove = (event: PointerEvent) => {
  if (!dragging.value || event.pointerId !== pointerId) return
  // 手指上移增大高度
  applyHeight(startHeight + (startY - event.clientY))
}

const onPointerUp = (event: PointerEvent) => {
  if (!dragging.value || event.pointerId !== pointerId) return
  const el = event.currentTarget as HTMLElement
  if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
  dragging.value = false
  setHeight(height.value)
}

const onClose = () => emit('close')

defineExpose({
  /** 设置高度，会吸附到最近档位 */
  setHeight,
  /** 返回距离指定高度最近的档位 */
  closestAnchor,
})
</script>

<template>
  <div class="je-floating-panel" :style="rootStyle">
    <div
      v-if="$slots.header"
      class="je-floating-panel__header"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <slot name="header" />
    </div>

    <div
      v-else
      class="je-floating-panel__header"
      :class="{ 'is-draggable': draggable }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <span class="je-floating-panel__grabber" aria-hidden="true" />
      <div v-if="title || closeable" class="je-floating-panel__bar">
        <span v-if="title" class="je-floating-panel__title">{{ title }}</span>
        <button
          v-if="closeable"
          type="button"
          class="je-floating-panel__close"
          aria-label="关闭"
          @pointerdown.stop
          @click="onClose"
        >
          <JeIcon name="close" :size="16" />
        </button>
      </div>
    </div>

    <div class="je-floating-panel__content">
      <JeScrollbar view-class="je-floating-panel__view">
        <slot />
      </JeScrollbar>
    </div>
  </div>
</template>

<style scoped>
.je-floating-panel {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  font-family: inherit;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: var(--je-border);
  border-radius: var(--je-radius-lg) var(--je-radius-lg) 0 0;
  box-shadow: var(--je-shadow-popup);
  padding-bottom: var(--je-floating-panel-safe-bottom, 0px);
  --je-floating-panel-duration: 0.3s;
  transition: height var(--je-floating-panel-duration) ease;
}

/* 抓手是独立的手势元素，可以独占 touch-action */
.je-floating-panel__header {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  padding: 10px 0 4px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.je-floating-panel__header.is-draggable {
  cursor: grab;
}

.je-floating-panel__header.is-draggable:active {
  cursor: grabbing;
}

.je-floating-panel__grabber {
  width: 36px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

.je-floating-panel__bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  min-height: 36px;
  padding: 0 48px;
}

.je-floating-panel__title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-floating-panel__close {
  position: absolute;
  top: 50%;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--je-text-muted);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--je-radius-sm);
  outline: none;
  transform: translateY(-50%);
  transition: background var(--je-duration) ease, color var(--je-duration) ease;
}

.je-floating-panel__close:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-floating-panel__close:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

.je-floating-panel__content {
  flex: 1 1 auto;
  min-height: 0;
  /* 内容滚动不把滚动链传递给页面 */
  overscroll-behavior: contain;
}

/* 内容层由 JeScrollbar 渲染，作用域样式要穿透才能命中 */
.je-floating-panel :deep(.je-floating-panel__view) {
  padding: 4px 0 12px;
}

@media (max-width: 768px) {
  .je-floating-panel__header {
    padding: 12px 0 6px;
  }

  .je-floating-panel__close {
    min-width: 44px;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-floating-panel {
    transition: none;
  }
}
</style>