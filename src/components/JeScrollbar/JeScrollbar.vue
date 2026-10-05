<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, type CSSProperties } from 'vue'

defineOptions({ name: 'JeScrollbar' })

type Axis = 'vertical' | 'horizontal'

/** 滑块长度下限，太短了不好拖 */
const DEFAULT_MIN_SIZE = 20

const props = withDefaults(
  defineProps<{
    /** 滚动区高度，不传则撑满父容器 */
    height?: string | number
    /** 滚动区最大高度，内容超出才出现滚动条 */
    maxHeight?: string | number
    /** 保留浏览器原生滚动条，只当作滚动容器用，不再自绘滑块 */
    native?: boolean
    /** 滑块常驻显示（默认悬停或滚动时才浮出） */
    always?: boolean
    /** 滑块最小长度（px） */
    minSize?: number
    /** 内容外层的元素标签名 */
    tag?: string
    /** 包裹层（真正滚动的元素）的自定义类名 */
    wrapClass?: string
    /** 包裹层的自定义样式 */
    wrapStyle?: CSSProperties | string
    /** 内容层的自定义类名 */
    viewClass?: string
    /** 内容层的自定义样式 */
    viewStyle?: CSSProperties | string
    /** 不监听容器尺寸变化。尺寸固定时开启可以省掉 ResizeObserver 的开销 */
    noresize?: boolean
    /**
     * 滚动视图的 id。真正滚动的是内部 wrap，外部组件（JeAffix 的 target、JeBacktop 的 target、
     * JeAnchor 的 container）都是按选择器去读 `scrollTop` 的，所以 id 必须落在这个元素上。
     */
    id?: string
  }>(),
  {
    height: undefined,
    maxHeight: undefined,
    native: false,
    always: false,
    minSize: DEFAULT_MIN_SIZE,
    tag: 'div',
    wrapClass: '',
    wrapStyle: undefined,
    viewClass: '',
    viewStyle: undefined,
    noresize: false,
    id: undefined,
  },
)

const emit = defineEmits<{
  /** 滚动时触发，回传当前滚动距离 */
  scroll: [payload: { scrollTop: number; scrollLeft: number }]
}>()

/**
 * 数字与「纯数字字符串」都按 px 处理（模板里 `height="320"` 传进来的是字符串，
 * 直接写进 style 就是非法 CSS 会被静默忽略）；带单位的字符串原样透传。
 */
const toUnit = (value?: string | number): string | undefined => {
  if (value === undefined) return undefined
  if (typeof value === 'number') return `${value}px`
  return /^-?\d+(\.\d+)?$/.test(value) ? `${value}px` : value
}

interface BarState {
  /** 滑块长度 */
  size: number
  /** 滑块沿轨道方向的偏移 */
  move: number
  /** 内容是否超出容器，不超出就不画滑块 */
  enabled: boolean
}

const wrapRef = ref<HTMLElement | null>(null)
const viewRef = ref<HTMLElement | null>(null)
const verticalBarRef = ref<HTMLElement | null>(null)
const horizontalBarRef = ref<HTMLElement | null>(null)

const vertical = reactive<BarState>({ size: 0, move: 0, enabled: false })
const horizontal = reactive<BarState>({ size: 0, move: 0, enabled: false })

const rootStyle = computed<CSSProperties>(() => {
  if (props.height !== undefined) return { height: toUnit(props.height) as string }
  // 只给了 max-height 时容器要随内容收缩，否则会在滚动区下方留出一段空白
  if (props.maxHeight !== undefined) return { height: 'auto' }
  return {}
})

const wrapMaxStyle = computed<CSSProperties>(() =>
  props.maxHeight !== undefined ? { maxHeight: toUnit(props.maxHeight) as string } : {},
)

/** 轨道长度取自身的 clientHeight / clientWidth；滑块是绝对定位，不会干扰这个测量值 */
const trackLength = (axis: Axis): number => {
  const el = axis === 'vertical' ? verticalBarRef.value : horizontalBarRef.value
  if (!el) return 0
  return axis === 'vertical' ? el.clientHeight : el.clientWidth
}

const stateOf = (axis: Axis): BarState => (axis === 'vertical' ? vertical : horizontal)

/** 按当前滚动位置与内容尺寸重算滑块的长度和偏移 */
const update = () => {
  const wrap = wrapRef.value
  if (!wrap) return

  const viewport = { vertical: wrap.clientHeight, horizontal: wrap.clientWidth }
  const content = { vertical: wrap.scrollHeight, horizontal: wrap.scrollWidth }
  const offset = { vertical: wrap.scrollTop, horizontal: wrap.scrollLeft }

  for (const axis of ['vertical', 'horizontal'] as const) {
    const bar = stateOf(axis)
    const track = trackLength(axis)
    // 轨道长度还没量出来（刚挂载、或该轴没有轨道）时先不画
    if (content[axis] - viewport[axis] <= 1 || track <= 0) {
      bar.enabled = false
      bar.size = 0
      bar.move = 0
      continue
    }

    const size = Math.min(track, Math.max(props.minSize, (viewport[axis] / content[axis]) * track))
    const maxMove = track - size
    const maxScroll = content[axis] - viewport[axis]
    bar.enabled = true
    bar.size = size
    bar.move = maxScroll > 0 ? (offset[axis] / maxScroll) * maxMove : 0
  }
}

const setScroll = (axis: Axis, value: number) => {
  const wrap = wrapRef.value
  if (!wrap) return
  if (axis === 'vertical') wrap.scrollTop = value
  else wrap.scrollLeft = value
  // 赋值后 scroll 事件是异步派发的，这里同步刷一次，拖动滑块才跟手
  update()
}

/* ---------------- 滑块显隐 ---------------- */

const hovering = ref(false)
const dragging = ref<Axis | null>(null)
/** 滚动或拖动结束后让滑块多留一会儿再淡出 */
const active = ref(false)
let idleTimer: ReturnType<typeof setTimeout> | null = null

const markActive = () => {
  active.value = true
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    active.value = false
    idleTimer = null
  }, 700)
}

const barsShown = computed(
  () => props.always || hovering.value || dragging.value !== null || active.value,
)

const handleScroll = () => {
  const wrap = wrapRef.value
  if (!wrap) return
  update()
  markActive()
  emit('scroll', { scrollTop: wrap.scrollTop, scrollLeft: wrap.scrollLeft })
}

/* ---------------- 拖动 / 点击轨道 ---------------- */

let dragStart = 0
let dragScrollStart = 0

const onThumbDown = (event: PointerEvent, axis: Axis) => {
  const wrap = wrapRef.value
  if (!wrap || event.button !== 0) return
  event.preventDefault()
  // 阻止冒泡，否则会同时触发轨道上的「跳到点击处」
  event.stopPropagation()
  dragging.value = axis
  dragStart = axis === 'vertical' ? event.clientY : event.clientX
  dragScrollStart = axis === 'vertical' ? wrap.scrollTop : wrap.scrollLeft
  // 捕获指针：拖出滚动条范围也不会丢 pointermove / pointerup
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

const onThumbMove = (event: PointerEvent) => {
  const axis = dragging.value
  const wrap = wrapRef.value
  if (!axis || !wrap) return
  const bar = stateOf(axis)
  const maxMove = trackLength(axis) - bar.size
  if (maxMove <= 0) return

  const maxScroll =
    axis === 'vertical' ? wrap.scrollHeight - wrap.clientHeight : wrap.scrollWidth - wrap.clientWidth
  const delta = (axis === 'vertical' ? event.clientY : event.clientX) - dragStart
  setScroll(axis, dragScrollStart + (delta / maxMove) * maxScroll)
}

const onThumbUp = (event: PointerEvent) => {
  if (!dragging.value) return
  dragging.value = null
  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
}

/** 点轨道空白处：把滑块中心挪到点击的位置 */
const onTrackDown = (event: PointerEvent, axis: Axis) => {
  const wrap = wrapRef.value
  if (!wrap || event.button !== 0) return
  const track = event.currentTarget as HTMLElement
  const bar = stateOf(axis)
  const maxMove = trackLength(axis) - bar.size
  if (maxMove <= 0) return

  const rect = track.getBoundingClientRect()
  const click = axis === 'vertical' ? event.clientY - rect.top : event.clientX - rect.left
  const ratio = Math.min(1, Math.max(0, (click - bar.size / 2) / maxMove))
  const maxScroll =
    axis === 'vertical' ? wrap.scrollHeight - wrap.clientHeight : wrap.scrollWidth - wrap.clientWidth
  setScroll(axis, ratio * maxScroll)
}

/* ---------------- 尺寸监听 ---------------- */

let observer: ResizeObserver | null = null

onMounted(() => {
  nextTick(update)
  if (props.noresize || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(update)
  if (wrapRef.value) observer.observe(wrapRef.value)
  // 内容增减也要重算滑块长度，否则列表变了滑块还是旧的
  if (viewRef.value) observer.observe(viewRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  if (idleTimer) clearTimeout(idleTimer)
})

defineExpose({
  /** 包裹层元素，可直接读取 scrollTop / scrollHeight */
  wrapRef,
  /** 手动重算滑块，内容尺寸变化又没开 ResizeObserver 时用 */
  update,
  /** 设置纵向滚动距离 */
  setScrollTop: (value: number) => setScroll('vertical', value),
  /** 设置横向滚动距离 */
  setScrollLeft: (value: number) => setScroll('horizontal', value),
  /** 滚动到指定坐标（x 横向、y 纵向） */
  scrollTo: (xCoord = 0, yCoord = 0) => {
    const wrap = wrapRef.value
    if (!wrap) return
    wrap.scrollLeft = xCoord
    wrap.scrollTop = yCoord
    update()
  },
})
</script>

<template>
  <div
    class="je-scrollbar"
    :class="{ 'is-native': native }"
    :style="rootStyle"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <div
      :id="id"
      ref="wrapRef"
      class="je-scrollbar__wrap"
      :class="wrapClass"
      :style="[wrapMaxStyle, wrapStyle]"
      @scroll.passive="handleScroll"
    >
      <component
        :is="tag"
        ref="viewRef"
        class="je-scrollbar__view"
        :class="viewClass"
        :style="viewStyle"
      >
        <slot />
      </component>
    </div>

    <template v-if="!native">
      <!-- 轨道常驻 DOM（量长度要用），显隐和事件都交给 is-visible 控制 -->
      <div
        ref="verticalBarRef"
        class="je-scrollbar__bar is-vertical"
        :class="{ 'is-visible': barsShown && vertical.enabled, 'is-dragging': dragging === 'vertical' }"
        @pointerdown="onTrackDown($event, 'vertical')"
      >
        <div
          class="je-scrollbar__thumb"
          :style="{ height: `${vertical.size}px`, transform: `translateY(${vertical.move}px)` }"
          @pointerdown="onThumbDown($event, 'vertical')"
          @pointermove="onThumbMove"
          @pointerup="onThumbUp"
          @pointercancel="onThumbUp"
        />
      </div>

      <div
        ref="horizontalBarRef"
        class="je-scrollbar__bar is-horizontal"
        :class="{
          'is-visible': barsShown && horizontal.enabled,
          'is-dragging': dragging === 'horizontal',
        }"
        @pointerdown="onTrackDown($event, 'horizontal')"
      >
        <div
          class="je-scrollbar__thumb"
          :style="{ width: `${horizontal.size}px`, transform: `translateX(${horizontal.move}px)` }"
          @pointerdown="onThumbDown($event, 'horizontal')"
          @pointermove="onThumbMove"
          @pointerup="onThumbUp"
          @pointercancel="onThumbUp"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.je-scrollbar {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.je-scrollbar__wrap {
  height: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  /* 原生滚动条藏起来，滚动条由下面的轨道自绘 */
  scrollbar-width: none;
}

.je-scrollbar__wrap::-webkit-scrollbar {
  display: none;
}

/* native 模式保留原生滚动条，沿用项目里细滚动条的样式 */
.je-scrollbar.is-native .je-scrollbar__wrap {
  scrollbar-width: thin;
  scrollbar-color: var(--je-border-color) transparent;
}

.je-scrollbar.is-native .je-scrollbar__wrap::-webkit-scrollbar {
  display: block;
  width: 6px;
  height: 6px;
}

.je-scrollbar.is-native .je-scrollbar__wrap::-webkit-scrollbar-thumb {
  background: var(--je-border-color);
  border-radius: 3px;
}

.je-scrollbar__view {
  box-sizing: border-box;
}

.je-scrollbar__bar {
  position: absolute;
  border-radius: 4px;
  opacity: 0;
  /* 隐藏时不吃事件，避免这 6px 挡住内容 */
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.je-scrollbar__bar.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.je-scrollbar__bar.is-vertical {
  top: 2px;
  right: 2px;
  bottom: 2px;
  width: 6px;
}

.je-scrollbar__bar.is-horizontal {
  right: 2px;
  bottom: 2px;
  left: 2px;
  height: 6px;
}

.je-scrollbar__thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--je-border-color);
  border-radius: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}

/* 悬停或拖动时加深，滑块在深色背景上更明确 */
.je-scrollbar__bar.is-visible .je-scrollbar__thumb:hover,
.je-scrollbar__bar.is-dragging .je-scrollbar__thumb {
  background: color-mix(in srgb, var(--je-text) 35%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .je-scrollbar__bar,
  .je-scrollbar__thumb {
    transition: none;
  }
}
</style>