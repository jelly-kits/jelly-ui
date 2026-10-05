<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, useId, watch } from 'vue'
import { JeIcon } from '../JeIcon'
import { JE_CAROUSEL_KEY, type JeCarouselItemMeta } from './types'

defineOptions({ name: 'JeCarousel' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    height?: string
    autoplay?: boolean
    /** 自动播放间隔，单位 ms */
    interval?: number
    loop?: boolean
    direction?: 'horizontal' | 'vertical'
    indicatorPosition?: 'inside' | 'outside' | 'none'
    arrow?: 'hover' | 'always' | 'never'
    trigger?: 'click' | 'hover'
  }>(),
  {
    modelValue: 0,
    height: '240px',
    autoplay: true,
    interval: 3000,
    loop: true,
    direction: 'horizontal',
    indicatorPosition: 'inside',
    arrow: 'hover',
    trigger: 'click',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [index: number]
}>()

const uid = useId()
const index = ref(props.modelValue)
const items = ref<JeCarouselItemMeta[]>([])
/** 鼠标悬停时暂停自动播放 */
const paused = ref(false)
/** 触摸拖动过程中的实时位移（px） */
const dragOffset = ref(0)
const dragging = ref(false)

const count = computed(() => items.value.length)

watch(
  () => props.modelValue,
  (value) => {
    if (value !== index.value) index.value = value
  },
)

const setIndex = (next: number) => {
  const total = count.value
  if (total <= 0) return
  const target = ((next % total) + total) % total
  if (target === index.value) return
  index.value = target
  emit('update:modelValue', target)
  emit('change', target)
}

/** 相对步进：loop 时首尾相接，否则夹在两端不动 */
const step = (delta: number) => {
  const total = count.value
  if (total <= 1) return
  const raw = index.value + delta
  setIndex(props.loop ? raw : Math.min(total - 1, Math.max(0, raw)))
}

const register = (item: JeCarouselItemMeta) => {
  if (!items.value.some((existing) => existing.uid === item.uid)) items.value.push(item)
}

const unregister = (id: string) => {
  items.value = items.value.filter((item) => item.uid !== id)
  if (index.value > items.value.length - 1) index.value = Math.max(0, items.value.length - 1)
}

provide(JE_CAROUSEL_KEY, { register, unregister })

/* ---------------- 自动播放 ---------------- */

let timer: number | undefined

const stopTimer = () => {
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
}

const startTimer = () => {
  stopTimer()
  if (!props.autoplay) return
  timer = window.setInterval(() => {
    // 页面被隐藏或指针悬停时这一拍直接跳过
    if (paused.value || document.hidden || count.value <= 1) return
    step(1)
  }, props.interval)
}

onMounted(startTimer)
onBeforeUnmount(stopTimer)

watch([() => props.autoplay, () => props.interval], startTimer)
watch(count, startTimer)

const onMouseEnter = () => {
  paused.value = true
}

const onMouseLeave = () => {
  paused.value = false
}

/* ---------------- 触摸滑动 ---------------- */

let startX = 0
let startY = 0
let pointerId = -1

const onPointerDown = (event: PointerEvent) => {
  // 鼠标交由箭头 / 指示点操作，拖动只服务触屏
  if (event.pointerType === 'mouse' || count.value <= 1) return
  // 按在箭头上时不进入拖拽：指针捕获会把随后的 click 一并抢走，箭头就点不动了
  if ((event.target as HTMLElement).closest('button')) return
  dragging.value = true
  startX = event.clientX
  startY = event.clientY
  pointerId = event.pointerId
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

const onPointerMove = (event: PointerEvent) => {
  if (!dragging.value || event.pointerId !== pointerId) return
  dragOffset.value =
    props.direction === 'vertical' ? event.clientY - startY : event.clientX - startX
}

const onPointerUp = (event: PointerEvent) => {
  if (!dragging.value || event.pointerId !== pointerId) return
  const el = event.currentTarget as HTMLElement
  if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId)
  dragging.value = false

  const offset = dragOffset.value
  dragOffset.value = 0
  // 超过阈值才翻页，否则轨道原地弹回
  if (Math.abs(offset) < 50) return
  step(offset < 0 ? 1 : -1)
}

const trackStyle = computed(() => {
  const base = -index.value * 100
  const offset = dragging.value ? dragOffset.value : 0
  const axis = props.direction === 'vertical' ? 'translateY' : 'translateX'
  return {
    transform: `${axis}(calc(${base}% + ${offset}px))`,
    transition: dragging.value ? 'none' : undefined,
  }
})

const rootStyle = computed(() => ({ '--je-carousel-height': props.height }))

const onIndicatorClick = (i: number) => setIndex(i)

const onIndicatorEnter = (i: number) => {
  if (props.trigger === 'hover') setIndex(i)
}

const onKeydown = (event: KeyboardEvent) => {
  const vertical = props.direction === 'vertical'
  if (vertical && event.key === 'ArrowUp') {
    event.preventDefault()
    step(-1)
  } else if (vertical && event.key === 'ArrowDown') {
    event.preventDefault()
    step(1)
  } else if (!vertical && event.key === 'ArrowLeft') {
    event.preventDefault()
    step(-1)
  } else if (!vertical && event.key === 'ArrowRight') {
    event.preventDefault()
    step(1)
  }
}
</script>

<template>
  <div
    :id="`${uid}-carousel`"
    class="je-carousel"
    :class="[
      `je-carousel--${direction}`,
      `je-carousel--indicator-${indicatorPosition}`,
      `je-carousel--arrow-${arrow}`,
    ]"
    :style="rootStyle"
    role="region"
    aria-roledescription="carousel"
    aria-label="轮播图"
    tabindex="0"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @keydown="onKeydown"
  >
    <div
      class="je-carousel__viewport"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="je-carousel__track" :style="trackStyle">
        <slot />
      </div>

      <!-- 箭头放在视口内：纵向 + outside 时根节点会变成一行，箭头仍以可视区居中 -->
      <template v-if="arrow !== 'never' && count > 1">
        <button
          type="button"
          class="je-carousel__arrow je-carousel__arrow--prev"
          aria-label="上一张"
          @click="step(-1)"
        >
          <JeIcon :name="direction === 'vertical' ? 'chevron-up' : 'chevron-left'" :size="20" />
        </button>
        <button
          type="button"
          class="je-carousel__arrow je-carousel__arrow--next"
          aria-label="下一张"
          @click="step(1)"
        >
          <JeIcon :name="direction === 'vertical' ? 'chevron-down' : 'chevron-right'" :size="20" />
        </button>
      </template>
    </div>

    <div
      v-if="indicatorPosition !== 'none' && count > 1"
      class="je-carousel__indicators"
      role="tablist"
      aria-label="轮播导航"
    >
      <button
        v-for="(item, i) in items"
        :id="`${uid}-tab-${i}`"
        :key="item.uid"
        type="button"
        class="je-carousel__indicator"
        role="tab"
        :aria-selected="i === index"
        :aria-label="item.name === undefined ? `第 ${i + 1} 张` : String(item.name)"
        @click="onIndicatorClick(i)"
        @mouseenter="onIndicatorEnter(i)"
      >
        <span class="je-carousel__dot" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.je-carousel {
  position: relative;
  font-family: inherit;
  outline: none;
}

.je-carousel:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
  border-radius: var(--je-radius-lg);
}

.je-carousel__viewport {
  position: relative;
  overflow: hidden;
  height: var(--je-carousel-height, 240px);
  border: var(--je-border);
  border-radius: var(--je-radius-lg);
}

/* 横向滑动交给组件，纵向滚动留给页面；反之亦然。这里不能用 touch-action: none */
.je-carousel--horizontal .je-carousel__viewport {
  touch-action: pan-y;
}

.je-carousel--vertical .je-carousel__viewport {
  touch-action: pan-x;
}

.je-carousel__track {
  display: flex;
  height: 100%;
  will-change: transform;
  transition: transform 0.5s var(--je-ease-out-back);
}

.je-carousel--vertical .je-carousel__track {
  flex-direction: column;
}

/* ---------------- 箭头 ---------------- */

.je-carousel__arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-popup) 70%, transparent);
  border: var(--je-border);
  border-radius: 50%;
  cursor: pointer;
  transform: translateY(-50%);
  transition: opacity 0.25s ease, background 0.2s ease;
}

.je-carousel__arrow:hover {
  background: color-mix(in srgb, var(--je-primary) 60%, transparent);
}

.je-carousel__arrow--prev {
  left: 10px;
}

.je-carousel__arrow--next {
  right: 10px;
}

.je-carousel--vertical .je-carousel__arrow {
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}

.je-carousel--vertical .je-carousel__arrow--prev {
  top: 10px;
}

.je-carousel--vertical .je-carousel__arrow--next {
  top: auto;
  bottom: 10px;
}

.je-carousel--arrow-always .je-carousel__arrow {
  opacity: 1;
}

.je-carousel--arrow-hover .je-carousel__arrow {
  opacity: 0;
  pointer-events: none;
}

.je-carousel--arrow-hover:hover .je-carousel__arrow,
.je-carousel--arrow-hover:focus-within .je-carousel__arrow {
  opacity: 1;
  pointer-events: auto;
}

/* ---------------- 指示点 ---------------- */

.je-carousel__indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.je-carousel--indicator-inside .je-carousel__indicators {
  position: absolute;
  right: 0;
  bottom: 4px;
  left: 0;
  z-index: 2;
}

.je-carousel--indicator-outside .je-carousel__indicators {
  padding: 8px 0 0;
}

/* 纵向：指示点竖排（横向时靠 inline 排成一行，这里必须显式改方向） */
.je-carousel--vertical .je-carousel__indicators {
  flex-direction: column;
}

/* 纵向 + inside：贴右侧、上下居中 */
.je-carousel--vertical.je-carousel--indicator-inside .je-carousel__indicators {
  top: 50%;
  right: 4px;
  bottom: auto;
  left: auto;
  transform: translateY(-50%);
}

/* 纵向 + outside：整体改成一行，指示点单独占右侧一列 */
.je-carousel--vertical.je-carousel--indicator-outside {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.je-carousel--vertical.je-carousel--indicator-outside .je-carousel__viewport {
  flex: 1 1 auto;
  min-width: 0;
}

.je-carousel--vertical.je-carousel--indicator-outside .je-carousel__indicators {
  padding: 0 0 0 8px;
}

/* 热区固定 44px，视觉上的圆点由 ::before 承担 */
.je-carousel__indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.je-carousel__indicator:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -8px;
}

.je-carousel__dot {
  width: 8px;
  height: 8px;
  background: color-mix(in srgb, var(--je-text) 45%, transparent);
  border-radius: 999px;
  transition: width var(--je-duration) var(--je-ease-overshoot),
    height var(--je-duration) var(--je-ease-overshoot), background var(--je-duration) ease;
}

/* 用属性选择器而不是 :class，避免 Vue 覆写命令式挂上的 class */
.je-carousel__indicator[aria-selected='true'] .je-carousel__dot {
  width: 22px;
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
}

/* 竖排时选中态是「拉高」而不是「拉宽」 */
.je-carousel--vertical .je-carousel__indicator[aria-selected='true'] .je-carousel__dot {
  width: 8px;
  height: 22px;
}

/* 窄屏没有 hover，hover 模式的箭头退化为常显 */
@media (max-width: 768px) {
  .je-carousel--arrow-hover .je-carousel__arrow {
    opacity: 1;
    pointer-events: auto;
  }

  .je-carousel--indicator-outside .je-carousel__indicators {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-carousel__track,
  .je-carousel__arrow,
  .je-carousel__dot {
    transition: none;
  }
}
</style>
