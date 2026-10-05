<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

defineOptions({ name: 'JeSwipeCell' })

type SwipePosition = 'left' | 'right' | ''

const props = withDefaults(
  defineProps<{
    /** 当前展开的一侧，空字符串表示关闭 */
    modelValue?: SwipePosition
    /** 禁用滑动 */
    disabled?: boolean
    /** 左侧操作区宽度，传数字按 px 处理；不传则按内容自适应 */
    leftWidth?: number | string
    /** 右侧操作区宽度，传数字按 px 处理；不传则按内容自适应 */
    rightWidth?: number | string
  }>(),
  {
    modelValue: '',
    disabled: false,
    leftWidth: undefined,
    rightWidth: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: SwipePosition]
  /** 展开某一侧 */
  open: [position: 'left' | 'right']
  /** 收起某一侧 */
  close: [position: 'left' | 'right']
  /** 未展开时点击内容区 */
  click: [event: MouseEvent]
}>()

const rootRef = ref<HTMLElement | null>(null)
const leftRef = ref<HTMLElement | null>(null)
const rightRef = ref<HTMLElement | null>(null)

const offset = ref(0)
const dragging = ref(false)

let moved = false
let locked = false
let startX = 0
let startY = 0
let originOffset = 0
let leftWidthPx = 0
let rightWidthPx = 0

const toPx = (value: number | string) =>
  typeof value === 'number' ? `${value}px` : value

const leftStyle = computed(() =>
  props.leftWidth === undefined ? undefined : { width: toPx(props.leftWidth) },
)
const rightStyle = computed(() =>
  props.rightWidth === undefined ? undefined : { width: toPx(props.rightWidth) },
)

const contentStyle = computed(() => ({ transform: `translateX(${offset.value}px)` }))

const measure = () => {
  leftWidthPx = leftRef.value?.offsetWidth ?? 0
  rightWidthPx = rightRef.value?.offsetWidth ?? 0
  applyModel()
}

const clamp = (value: number) => Math.min(Math.max(value, -rightWidthPx), leftWidthPx)

const applyModel = () => {
  if (dragging.value) return
  offset.value =
    props.modelValue === 'left'
      ? leftWidthPx
      : props.modelValue === 'right'
        ? -rightWidthPx
        : 0
}

const setPosition = (value: SwipePosition) => {
  const prev = props.modelValue
  offset.value = value === 'left' ? leftWidthPx : value === 'right' ? -rightWidthPx : 0
  emit('update:modelValue', value)
  if (value && value !== prev) emit('open', value)
  if (!value && prev) emit('close', prev)
}

const onPointerDown = (event: PointerEvent) => {
  if (props.disabled) return
  dragging.value = true
  moved = false
  locked = false
  startX = event.clientX
  startY = event.clientY
  originOffset = offset.value
  rootRef.value?.setPointerCapture(event.pointerId)
}

const onPointerMove = (event: PointerEvent) => {
  if (!dragging.value) return
  const dx = event.clientX - startX
  const dy = event.clientY - startY

  if (!locked) {
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
    // 竖向意图更强就交还给页面滚动
    if (Math.abs(dy) >= Math.abs(dx)) {
      dragging.value = false
      return
    }
    // 已经贴住某侧还继续往同方向拉，没必要接管
    if ((originOffset >= leftWidthPx && dx > 0) || (originOffset <= -rightWidthPx && dx < 0)) {
      dragging.value = false
      return
    }
    locked = true
  }

  moved = true
  offset.value = clamp(originOffset + dx)
}

const onPointerUp = (event: PointerEvent) => {
  if (!dragging.value) return
  dragging.value = false
  if (rootRef.value?.hasPointerCapture(event.pointerId)) {
    rootRef.value.releasePointerCapture(event.pointerId)
  }
  if (!locked) return

  if (offset.value > 0 && offset.value > leftWidthPx / 2) setPosition('left')
  else if (offset.value < 0 && -offset.value > rightWidthPx / 2) setPosition('right')
  else setPosition('')
}

const onClick = (event: MouseEvent) => {
  if (props.disabled) return
  // 拖动结束后浏览器还会补一次 click，这里吞掉
  if (moved) {
    moved = false
    return
  }
  if (props.modelValue) {
    setPosition('')
    return
  }
  emit('click', event)
}

/** 供外部调用：展开指定一侧 */
const open = (position: 'left' | 'right' = 'right') => {
  if (props.disabled) return
  setPosition(position)
}

/** 供外部调用：收起 */
const close = () => {
  if (!props.modelValue) return
  setPosition('')
}

let observer: ResizeObserver | null = null

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    if (leftRef.value) observer.observe(leftRef.value)
    if (rightRef.value) observer.observe(rightRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

watch(() => props.modelValue, applyModel)

defineExpose({ open, close })
</script>

<template>
  <div
    ref="rootRef"
    class="je-swipe-cell"
    :class="{
      'is-dragging': dragging,
      'is-disabled': disabled,
      'reveal-left': offset > 0,
      'reveal-right': offset < 0,
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      v-if="$slots.left"
      ref="leftRef"
      class="je-swipe-cell__actions je-swipe-cell__actions--left"
      :style="leftStyle"
    >
      <slot name="left" />
    </div>

    <div class="je-swipe-cell__content" :style="contentStyle" @click="onClick">
      <slot />
    </div>

    <div
      v-if="$slots.right"
      ref="rightRef"
      class="je-swipe-cell__actions je-swipe-cell__actions--right"
      :style="rightStyle"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.je-swipe-cell {
  position: relative;
  overflow: hidden;
  font-family: inherit;
  /* 竖向滚动交给浏览器，横向位移由 pointer 事件接管 */
  touch-action: pan-y;
}

.je-swipe-cell__content {
  position: relative;
  z-index: 1;
  /* 内容需要盖住背后的操作区，所以默认给一个近似不透明的底色 */
  background: var(--je-swipe-cell-bg, var(--je-popup));
  transition: transform var(--je-duration) var(--je-ease-out-back);
}

.je-swipe-cell.is-dragging {
  user-select: none;
  -webkit-user-select: none;
}

.je-swipe-cell.is-dragging .je-swipe-cell__content {
  transition: none;
}

.je-swipe-cell__actions {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  /* 未展开的一侧不参与显示，免得透过半透明内容漏出来 */
  visibility: hidden;
}

.je-swipe-cell.reveal-left .je-swipe-cell__actions--left,
.je-swipe-cell.reveal-right .je-swipe-cell__actions--right {
  visibility: visible;
}

.je-swipe-cell__actions--left {
  left: 0;
}

.je-swipe-cell__actions--right {
  right: 0;
}

.je-swipe-cell.is-disabled .je-swipe-cell__content {
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .je-swipe-cell__content {
    transition: none;
  }
}
</style>
