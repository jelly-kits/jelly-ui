<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import JeScrollbar from '../JeScrollbar/JeScrollbar.vue'
import { jeTabKey, type JeTabContext, type JeTabName } from './types'

defineOptions({ name: 'JeTab' })

const props = withDefaults(
  defineProps<{
    /** 当前激活项的 name */
    modelValue?: JeTabName
    /** 内容区可左右滑动切页 */
    swipeable?: boolean
    /** 切页有位移过渡 */
    animated?: boolean
    /** 头部吸顶 */
    sticky?: boolean
    /** 吸顶时距容器顶部的距离 */
    offsetTop?: number | string
    /** 切页过渡时长（毫秒） */
    duration?: number
    /** 触发切页的最小横向滑动距离（px） */
    swipeThreshold?: number
    /** 激活下划线宽度，数字按 px，字符串支持百分比；缺省取激活项宽度 */
    lineWidth?: number | string
    /** 激活下划线高度 */
    lineHeight?: number | string
    /** 激活态颜色 */
    activeColor?: string
    /** 未激活态颜色 */
    inactiveColor?: string
    /** 头部背景色 */
    background?: string
    /** 标题放不下时省略并平分宽度 */
    ellipsis?: boolean
  }>(),
  {
    modelValue: undefined,
    swipeable: true,
    animated: true,
    sticky: false,
    offsetTop: 0,
    duration: 300,
    swipeThreshold: 60,
    lineWidth: undefined,
    lineHeight: 3,
    activeColor: '',
    inactiveColor: '',
    background: '',
    ellipsis: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [name: JeTabName]
  /** 激活项变化 */
  change: [name: JeTabName, index: number]
  /** 点击标题（含点击已激活项） */
  click: [name: JeTabName, index: number]
}>()

/** 未受控时的内部激活 name */
const innerValue = ref<JeTabName | undefined>(undefined)
const activeName = computed<JeTabName | undefined>(() => props.modelValue ?? innerValue.value)

/* ---------------- 子项注册 ---------------- */

interface TabEntry {
  name: JeTabName
  disabled: () => boolean
}

const entries = ref<TabEntry[]>([])
let seed = 0
const genName = () => {
  seed += 1
  return seed
}

const register = (name: JeTabName, disabled: () => boolean) => {
  if (entries.value.some((entry) => entry.name === name)) return
  entries.value = [...entries.value, { name, disabled }]
  // 未受控且尚无激活项时默认选中第一个注册的标签
  if (props.modelValue === undefined && innerValue.value === undefined) innerValue.value = name
}

const unregister = (name: JeTabName) => {
  entries.value = entries.value.filter((entry) => entry.name !== name)
}

const getIndex = (name: JeTabName) => entries.value.findIndex((entry) => entry.name === name)

const activeIndex = computed(() =>
  activeName.value === undefined ? -1 : getIndex(activeName.value),
)

const isActive = (name: JeTabName) => activeName.value !== undefined && name === activeName.value

const changeTo = (name: JeTabName, index: number) => {
  if (props.modelValue === undefined) innerValue.value = name
  emit('update:modelValue', name)
  emit('change', name, index)
}

const activate = (name: JeTabName, index: number) => {
  emit('click', name, index)
  if (name === activeName.value) return
  changeTo(name, index)
}

/** 沿 step 方向找下一个可用项并激活 */
const switchBy = (step: number) => {
  const list = entries.value
  const len = list.length
  if (len === 0) return
  const current = activeIndex.value < 0 ? 0 : activeIndex.value
  for (let offset = 1; offset <= len; offset += 1) {
    const next = (((current + step * offset) % len) + len) % len
    const entry = list[next]
    if (entry && !entry.disabled()) {
      changeTo(entry.name, next)
      return
    }
  }
}

/* ---------------- 上下文 ---------------- */

const activeColor = computed(() => props.activeColor || 'var(--je-primary)')
const inactiveColor = computed(() => props.inactiveColor || 'var(--je-text-muted)')
const ellipsis = computed(() => props.ellipsis)
const navRef = ref<HTMLElement | null>(null)

const context: JeTabContext = {
  activeName,
  genName,
  register,
  unregister,
  getIndex,
  activate,
  isActive,
  navRef,
  activeColor,
  inactiveColor,
  ellipsis,
}
provide(jeTabKey, context)

/* ---------------- 激活下划线 ---------------- */

const lineVisible = ref(false)
const lineStyle = ref<{ transform: string; width: string }>({ transform: 'translateX(0px)', width: '0px' })

const updateLine = () => {
  const el = navRef.value?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
  if (!el) {
    lineVisible.value = false
    return
  }
  const width =
    props.lineWidth === undefined
      ? `${el.offsetWidth}px`
      : typeof props.lineWidth === 'number'
        ? `${props.lineWidth}px`
        : props.lineWidth
  lineStyle.value = { transform: `translateX(${el.offsetLeft}px)`, width }
  lineVisible.value = true
}

/** 把激活项滚进可视区中部 */
const centerActive = () => {
  const el = navRef.value?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
  el?.scrollIntoView({ block: 'nearest', inline: 'center' })
}

const sync = () => {
  updateLine()
  centerActive()
}

const resize = () => {
  void nextTick(sync)
}

watch([activeName, entries, () => props.lineWidth, () => props.ellipsis], () => {
  void nextTick(sync)
})

// 标题按钮是子项 Teleport 进来的，容器就绪后再量一次
watch(navRef, () => {
  void nextTick(sync)
})

let observer: ResizeObserver | null = null

onMounted(() => {
  void nextTick(sync)
  if (typeof ResizeObserver !== 'undefined' && navRef.value) {
    observer = new ResizeObserver(updateLine)
    observer.observe(navRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

/* ---------------- 滑动切页 ---------------- */

const dragging = ref(false)
const dragOffset = ref(0)
let startX = 0
let startY = 0
let axis: 'x' | 'y' | null = null

const onTouchStart = (event: TouchEvent) => {
  if (!props.swipeable) return
  const touch = event.touches[0]
  if (!touch) return
  startX = touch.clientX
  startY = touch.clientY
  dragOffset.value = 0
  axis = null
  dragging.value = true
}

const onTouchMove = (event: TouchEvent) => {
  if (!dragging.value) return
  const touch = event.touches[0]
  if (!touch) return
  const dx = touch.clientX - startX
  const dy = touch.clientY - startY
  // 方向未定时先观察：横向位移更大才认定是切页手势，否则放行给纵向滚动
  if (axis === null) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
  }
  if (axis !== 'x') return
  const index = activeIndex.value < 0 ? 0 : activeIndex.value
  const atStart = index <= 0 && dx > 0
  const atEnd = index >= entries.value.length - 1 && dx < 0
  dragOffset.value = atStart || atEnd ? dx * 0.3 : dx
}

const onTouchEnd = () => {
  if (!dragging.value) return
  dragging.value = false
  const dx = dragOffset.value
  dragOffset.value = 0
  const horizontal = axis === 'x'
  axis = null
  if (horizontal && Math.abs(dx) > props.swipeThreshold) switchBy(dx < 0 ? 1 : -1)
}

/* ---------------- 样式 ---------------- */

const lineGradient = computed(
  () =>
    `linear-gradient(90deg, color-mix(in srgb, ${activeColor.value} 55%, var(--je-primary-end)), ${activeColor.value})`,
)

const rootStyle = computed(() => ({
  '--je-tab-duration': `${props.duration}ms`,
  '--je-tab-line-height':
    typeof props.lineHeight === 'number' ? `${props.lineHeight}px` : props.lineHeight,
  '--je-tab-line': lineGradient.value,
}))

const headerStyle = computed(() => ({
  background: props.background || 'transparent',
  top: typeof props.offsetTop === 'number' ? `${props.offsetTop}px` : props.offsetTop,
}))

const trackStyle = computed(() => {
  const index = activeIndex.value < 0 ? 0 : activeIndex.value
  return {
    transform: `translateX(calc(${-index * 100}% + ${dragOffset.value}px))`,
    transition:
      dragging.value || !props.animated
        ? 'none'
        : `transform ${props.duration}ms var(--je-ease-out-back)`,
  }
})

defineExpose({ resize })
</script>

<template>
  <div class="je-tab" :style="rootStyle">
    <div class="je-tab__header" :class="{ 'is-sticky': sticky }" :style="headerStyle">
      <JeScrollbar>
        <div ref="navRef" class="je-tab__nav" :class="{ 'is-stretch': ellipsis }">
          <span
            class="je-tab__line"
            :class="{ 'is-visible': lineVisible }"
            :style="lineStyle"
            aria-hidden="true"
          />
        </div>
      </JeScrollbar>
    </div>

    <div
      class="je-tab__content"
      @touchstart="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <div class="je-tab__track" :style="trackStyle">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.je-tab {
  font-family: inherit;
  color: var(--je-text);
}

.je-tab__header {
  position: relative;
  height: 44px;
}

.je-tab__header.is-sticky {
  position: sticky;
  z-index: 10;
}

.je-tab__nav {
  position: relative;
  display: flex;
  width: max-content;
}

/* 省略模式：标题平分宽度，不横向滚动 */
.je-tab__nav.is-stretch {
  width: 100%;
}

.je-tab__line {
  position: absolute;
  bottom: 0;
  left: 0;
  height: var(--je-tab-line-height, 3px);
  background: var(--je-tab-line, var(--je-primary));
  border-radius: 999px;
  opacity: 0;
  pointer-events: none;
  transition: transform var(--je-tab-duration, 300ms) var(--je-ease-out-back),
    width var(--je-tab-duration, 300ms) var(--je-ease-out-back), opacity 0.2s ease;
}

.je-tab__line.is-visible {
  opacity: 1;
}

.je-tab__content {
  position: relative;
  overflow: hidden;
}

.je-tab__track {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .je-tab__line {
    transition: none;
  }
}
</style>